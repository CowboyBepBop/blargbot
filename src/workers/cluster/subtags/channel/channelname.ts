import { BaseSubtag, BBTagContext, ChannelNotFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ChannelNameSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelname',
            aliases: ['categoryname'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns the name of the current channel.',
                    exampleCode: 'This channel\'s name is {channelname}',
                    exampleOut: 'This channel\'s name is test-channel',
                    execute: (ctx) => ctx.channel.name
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Returns the name of the given `channel`. If it cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: '{channelname;111111111111111}',
                    exampleOut: 'cooler-test-channel',
                    execute: (ctx, [channel, quiet]) => this.getChannelName(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getChannelName(
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
        return channel.name;
    }
}
