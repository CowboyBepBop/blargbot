import { BaseSubtag, BBTagContext, ChannelNotFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelIsCategorySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channeliscategory',
            aliases: ['iscategory'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a category. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{channeliscategory;cool category}\n{channeliscategory;category that doesn\'t exist}',
                    exampleOut: 'true\n(nothing is returned here)',
                    execute: (ctx, [channel, quiet]) => this.isCategory(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async isCategory(
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
        return guard.isCategoryChannel(channel);
    }
}
