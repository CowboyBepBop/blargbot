import { BaseSubtag, BBTagContext, BBTagRuntimeError, ChannelNotFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { GuildChannels } from 'discord.js';

export class ChannelPosSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelpos',
            aliases: ['categorypos'],
            category: SubtagType.CHANNEL,
            desc: 'The position is the index per channel type (text, voice or category) in the channel list.',
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns the position of the current channel.',
                    exampleCode: 'This channel is in position {channelpos}',
                    exampleOut: 'This channel is in position 1',
                    execute: (ctx) => this.getChanelPositionCore(ctx.channel)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the position of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'The position of test-channel is {channelpos;test-channel}',
                    exampleOut: 'The position of test-channel is 0',
                    execute: (ctx, [channel, quiet]) => this.getChannelPosition(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getChannelPosition(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<string | undefined> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            if (quiet)
                return undefined;
            throw new ChannelNotFoundError(channelStr);
        }
        return this.getChanelPositionCore(channel);
    }

    private getChanelPositionCore(channel: GuildChannels): string {
        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Threads dont have a position', `${channel.toString()} is a thread and doesnt have a position`);

        return channel.position.toString();
    }
}
