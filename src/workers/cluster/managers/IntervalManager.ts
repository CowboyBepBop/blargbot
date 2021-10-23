import { Cluster } from '@cluster';
import { CustomCommandLimit } from '@cluster/bbtag';
import { BBTagExecutionResult } from '@cluster/types';
import { guard, sleep, snowflake } from '@cluster/utils';
import { GuildTriggerTag } from '@core/types';
import { Collection, Guild, GuildMember, GuildTextBasedChannels } from 'discord.js';
import moment from 'moment';
import { Duration } from 'moment-timezone';

export class IntervalManager {
    public constructor(
        private readonly cluster: Cluster,
        public readonly timeLimit: Duration
    ) {
    }

    public async invokeAll(): Promise<void> {
        const nonce = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').toUpperCase();

        const intervals = (await this.cluster.database.guilds.getIntervals())
            .map(i => ({ guild: this.cluster.discord.guilds.cache.get(i.guildId), interval: i.interval }))
            .filter((i): i is { guild: Guild; interval: GuildTriggerTag; } => i.guild !== undefined);

        this.cluster.logger.info(`[${nonce}] Running intervals on ${intervals.length} guilds`);

        const resolutions = await Promise.all(intervals.map(async ({ interval, guild }) => {
            this.cluster.logger.debug(`[${nonce}] Performing interval on ${guild.id}`);
            const result = await this.cluster.intervals.invoke(guild, interval);
            return { result: typeof result === 'string' ? result : 'SUCCESS' as const, guild: guild.id };
        }));

        this.cluster.logger.log(resolutions);

        const { success, failed, tooLong } = resolutions.reduce((p, c) => {
            switch (c.result) {
                case 'TOO_LONG':
                    p.tooLong.push(c.guild);
                    break;
                case 'FAILED':
                    p.failed.push(c.guild);
                    break;
                case 'SUCCESS':
                    p.success.push(c.guild);
                    break;
            }
            return p;
        }, { success: [] as string[], failed: [] as string[], tooLong: [] as string[] });

        this.cluster.logger.info(`[${nonce}] Intervals complete. ${success.length} success | ${failed.length} fail | ${tooLong.length} unresolved`);
        if (tooLong.length > 0) {
            this.cluster.logger.info(`[${nonce}] Unresolved in:\n${tooLong.join('\n')}`);
        }
    }

    public async invoke(guild: Guild): Promise<BBTagExecutionResult | 'NO_INTERVAL' | 'TOO_LONG' | 'FAILED' | 'MISSING_AUTHORIZER' | 'MISSING_CHANNEL'>
    public async invoke(guild: Guild, interval: GuildTriggerTag): Promise<BBTagExecutionResult | 'TOO_LONG' | 'FAILED' | 'MISSING_AUTHORIZER' | 'MISSING_CHANNEL'>
    public async invoke(guild: Guild, interval?: GuildTriggerTag): Promise<BBTagExecutionResult | 'NO_INTERVAL' | 'TOO_LONG' | 'FAILED' | 'MISSING_AUTHORIZER' | 'MISSING_CHANNEL'> {
        interval ??= await this.cluster.database.guilds.getInterval(guild.id);
        if (interval === undefined) return 'NO_INTERVAL';

        const id = interval.authorizer ?? interval.author;
        const member = await this.cluster.util.getMember(guild, id);
        if (member === undefined) return 'MISSING_AUTHORIZER';
        const channel = guild.channels.cache.find(guard.isTextableChannel);
        if (channel === undefined) return 'MISSING_CHANNEL';

        return await Promise.race([
            this.invokeCore(member, channel, interval),
            sleep(this.timeLimit.asMilliseconds()).then(() => 'TOO_LONG' as const)
        ]);
    }

    private async invokeCore(member: GuildMember, channel: GuildTextBasedChannels, interval: GuildTriggerTag): Promise<BBTagExecutionResult | 'FAILED'> {
        try {
            const result = await this.cluster.bbtag.execute(interval.content, {
                message: {
                    channel: channel,
                    author: member.user,
                    member: member,
                    createdTimestamp: moment.now(),
                    attachments: new Collection(),
                    embeds: [],
                    content: '',
                    id: snowflake.create().toString()
                },
                limit: new CustomCommandLimit(),
                inputRaw: '',
                isCC: true,
                rootTagName: '_interval',
                author: interval.author,
                authorizer: interval.authorizer,
                silent: true
            });
            this.cluster.logger.log('Interval on guild', member.guild.id, 'executed in', result.duration.total);
            return result;
        } catch (err: unknown) {
            this.cluster.logger.error('Issue with interval:', member.guild, err);
            return 'FAILED';
        }
    }
}
