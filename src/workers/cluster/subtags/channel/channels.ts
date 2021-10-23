import { BaseSubtag, BBTagContext, ChannelNotFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ChannelsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channels',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns an array of channel IDs in the current guild',
                    exampleCode: 'This guild has {length;{channels}} channels.',
                    exampleOut: 'This guild has {length;{channels}} channels.',
                    execute: (ctx) => ctx.guild.channels.cache.map(c => c.id)
                },
                {
                    parameters: ['category', 'quiet?'],
                    description: 'Returns an array of channel IDs in within the given `category`. If `category` is not a category, returns an empty array. If `category` cannot be found returns `No channel found`, or nothing if `quiet` is `true`.',
                    exampleCode: 'Category cat-channels has {length;{channels;cat-channels}} channels.',
                    exampleOut: 'Category cat-channels has 6 channels.',
                    execute: (ctx, [category, quiet]) => this.getChannelsInCategory(ctx, category.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getChannelsInCategory(
        context: BBTagContext,
        channelStr: string,
        quiet: boolean
    ): Promise<string[] | undefined> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            if (quiet)
                return undefined;
            throw new ChannelNotFoundError(channelStr);
        }
        if (channel.type !== 'GUILD_CATEGORY')
            return [];
        return channel.children.map(c => c.id);
    }
}
