import { BaseSubtag, BBTagContext, BBTagRuntimeError, ChannelNotFoundError } from '@cluster/bbtag';
import { discordUtil, guard, SubtagType } from '@cluster/utils';

export class ArchivedThreadsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'archivedthreads',
            category: SubtagType.THREAD,
            definition: [
                {
                    parameters: ['channel?'],
                    description: '`channel` defaults to the current channel\n\nLists all archived threads in `channel`.\nReturns an array of thread channel IDs.',
                    exampleCode: '{archivedthreads;123456789123456}',
                    exampleOut: '["123456789012345", "98765432198765"]',
                    execute: (ctx, [channel]) => this.archivedThreads(ctx, channel.value)
                }
            ]
        });
    }
    public async archivedThreads(context: BBTagContext, channelStr: string): Promise<string[]> {
        const channel = await context.queryChannel(channelStr);
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);
        if (guard.isThreadableChannel(channel))
            return (await channel.threads.fetchArchived()).threads.map(t => t.id);
        throw new BBTagRuntimeError(discordUtil.notThreadable(channel));
    }
}
