import { BaseSubtag, BBTagContext, BBTagRuntimeError, ChannelNotFoundError } from '@cluster/bbtag';
import { discordUtil, guard, SubtagType } from '@cluster/utils';

export class ThreadChannelsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'threadchannels',
            category: SubtagType.THREAD,
            aliases: ['threads'],
            definition: [
                {
                    parameters: ['channel?'],
                    description: 'Lists all active threads in the current server. If `channel` is provided, lists all active threads in `channel`',
                    exampleCode: 'This guild has {length;{threads}} active threads!',
                    exampleOut: 'This guild has 11 active threads!',
                    execute: (ctx, [channel]) => this.threadChannels(ctx, channel.value)
                }
            ]
        });
    }

    public async threadChannels(context: BBTagContext, channelStr: string): Promise<string[]> {
        if (channelStr === '')
            return (await context.guild.channels.fetchActiveThreads()).threads.map(t => t.id);
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);
        if (guard.isThreadableChannel(channel))
            return (await channel.threads.fetchActive()).threads.map(t => t.id);
        throw new BBTagRuntimeError(discordUtil.notThreadable(channel));
    }
}
