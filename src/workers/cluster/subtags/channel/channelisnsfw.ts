import { BaseSubtag, BBTagContext, ChannelNotFoundError } from '@cluster/bbtag';
import { guard, SubtagType } from '@cluster/utils';

export class ChannelIsNsfw extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelisnsfw',
            category: SubtagType.CHANNEL,
            aliases: ['isnsfw'],
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Checks if the current channel is a NSFW channel.',
                    exampleCode: '{if;{isnsfw};Spooky nsfw stuff;fluffy bunnies}',
                    exampleOut: 'fluffy bunnies',
                    execute: (ctx) => !guard.isThreadChannel(ctx.channel) && ctx.channel.nsfw
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a NSFW channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isnsfw;SFW Cat pics}',
                    exampleOut: 'true',
                    execute: (ctx, [channel, quiet]) => this.isNsfwChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async isNsfwChannel(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<boolean | undefined> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            if (quiet)
                return undefined;
            throw new ChannelNotFoundError(channelStr);
        }
        return !guard.isThreadChannel(channel) && guard.isTextableChannel(channel) && channel.nsfw;
    }
}
