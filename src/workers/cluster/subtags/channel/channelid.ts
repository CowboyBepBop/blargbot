import { BaseSubtag, BBTagContext, ChannelNotFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ChannelIdSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelid',
            aliases: ['categoryid'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns the ID of the current channel.',
                    exampleCode: '{channelid}',
                    exampleOut: '111111111111111',
                    execute: (ctx) => ctx.channel.id
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the ID of the given channel. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelid;cool channel}\n{channelid;some channel that doesn\'t exist;true}',
                    exampleOut: '111111111111111\n(nothing is returned here)',
                    execute: (ctx, [channel, quiet]) => this.getChannelId(ctx, channel.value, quiet.value !== '')

                }
            ]
        });
    }

    public async getChannelId(
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
        return channel.id;
    }
}
