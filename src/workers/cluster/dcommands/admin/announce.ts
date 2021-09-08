import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { guard, humanize } from '@core/utils';
import { KnownChannel, MessageEmbedOptions, MessageMentionOptions, NewsChannel, Role, TextChannel, ThreadChannel } from 'discord.js';

export class AnnounceCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'announce',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'reset',
                    description: 'Resets the current configuration for announcements',
                    execute: (ctx) => this.reset(ctx)
                },
                {
                    parameters: 'configure {channel:channel?} {role:role?}',
                    description: 'Resets the current configuration for announcements',
                    execute: (ctx, [channel, role]) => this.configure(ctx, channel.asOptionalChannel, role.asOptionalRole)
                },
                {
                    parameters: '{message+}',
                    description: 'Sends an announcement using the current configuration',
                    execute: (ctx, [message]) => this.announce(ctx, message.asString)
                },
                {
                    parameters: 'info',
                    description: 'Displays the current configuration for announcements on this server',
                    execute: (ctx) => this.showInfo(ctx)
                }
            ]
        });
    }

    public async reset(context: GuildCommandContext): Promise<string> {
        await context.database.guilds.setAnnouncements(context.channel.guild.id, undefined);
        return this.success(`Announcement configuration reset! Do \`${context.prefix}announce configure\` to reconfigure it.`);
    }

    public async configure(context: GuildCommandContext, channel: KnownChannel | undefined, role: Role | undefined): Promise<string | undefined> {
        const result = await this.configureCore(context, channel, role);
        switch (result) {
            case true: return this.success('Your announcements have been configured!');
            case false: return undefined;
            default: return result;
        }
    }

    public async announce(context: GuildCommandContext, message: string): Promise<string> {
        let config = await this.getConfigSafe(context);
        if (config === undefined || config.channel === undefined || config.role === undefined) {
            const result = await this.configureCore(context, undefined, undefined);
            switch (result) {
                case true: break;
                case false: return this.error('You must configure a role and channel to use announcements!');
                default: return result;
            }
            config = await this.getConfigSafe(context);
            if (config === undefined || config.channel === undefined || config.role === undefined)
                return this.error('Oops, seems like your config changes didnt save! Please try again.');
        }

        const topRole = context.message.member.roles.color;
        const mentions: MessageMentionOptions = config.role.id === config.role.guild.id
            ? { parse: ['everyone'] }
            : { roles: [config.role.id] };
        const embed: MessageEmbedOptions = {
            description: message,
            color: topRole?.color,
            author: {
                name: 'Announcement',
                icon_url: 'http://i.imgur.com/zcGyun6.png',
                url: `https://blargbot.xyz/user/${context.author.id}`
            },
            footer: {
                text: humanize.fullName(context.author),
                icon_url: context.author.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
            },
            timestamp: context.timestamp
        };

        const announcement = await context.send(config.channel, {
            content: config.role.toString(),
            embeds: [embed],
            allowedMentions: mentions
        });

        if (announcement === undefined)
            return this.error('I wasnt able to send that message for some reason!');

        if (announcement.crosspostable)
            await announcement.crosspost();

        return this.success('I\'ve sent the announcement!');
    }

    public async showInfo(context: GuildCommandContext): Promise<string> {
        const config = await this.getConfigSafe(context);
        if (config === undefined)
            return this.info(`Announcements are not yet configured for this server. Please use \`${context.prefix}announce configure\` to set them up`);

        if (config.channel === undefined || config.role === undefined) {
            await this.reset(context);
            const reason = config.channel === undefined ? config.role === undefined
                ? 'Your announcement channel and role no longer exist'
                : 'Your announcement channel no longer exists'
                : 'Your announcement role no longer exists';

            return this.error(`${reason}. Please use \`${context.prefix}announce configure\` to reconfigure your announcements`);
        }

        return this.info(`Announcements will be sent in ${config.channel.toString()} and will mention ${config.role.toString()}`);
    }

    private async getConfigSafe(context: GuildCommandContext): Promise<{ channel: TextChannel | NewsChannel | ThreadChannel | undefined; role: Role | undefined; } | undefined> {
        const config = await context.database.guilds.getAnnouncements(context.channel.guild.id);
        if (config === undefined)
            return undefined;

        let channel = await context.util.getChannel(config.channel);
        const role = await context.util.getRole(context.channel.guild.id, config.role);

        if (channel === undefined || !guard.isGuildChannel(channel) || !guard.isTextableChannel(channel) || guard.isThreadChannel(channel) && channel.archived === true)
            channel = undefined;

        return { channel, role };
    }

    private async configureCore(context: GuildCommandContext, channel: KnownChannel | undefined, role: Role | undefined): Promise<boolean | string> {
        if (channel === undefined) {
            const result = await context.queryChannel({
                choices: context.channel.guild.channels.cache.filter(guard.isTextableChannel).values(),
                prompt: this.info('Please select the channel that announcements should be put in.')
            });

            if (result.state !== 'SUCCESS')
                return false;

            channel = result.value;

            if (channel === undefined)
                return false;
        }

        if (!guard.isGuildChannel(channel) || channel.guild !== context.channel.guild)
            return this.error('The announcement channel must be on this server!');
        if (!guard.isTextableChannel(channel))
            return this.error('The announcement channel must be a text channel!');

        if (role === undefined) {
            const result = await context.queryRole({
                prompt: this.info('Please select the role to mention when announcing.')
            });

            if (result.state !== 'SUCCESS')
                return false;

            role = result.value;
        }

        await context.database.guilds.setAnnouncements(context.channel.guild.id, {
            channel: channel.id,
            role: role.id
        });
        return true;
    }
}
