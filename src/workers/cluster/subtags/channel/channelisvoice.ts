import { BaseSubtag, BBTagContext, ChannelNotFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';

export class ChannelIsVoice extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelisvoice',
            aliases: ['isvoice'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Checks if the current channel is a voice channel.',
                    exampleCode: '{if;{isvoice};How did you even call the command?;Yeah you can write stuff here}',
                    exampleOut: 'Yeah you can write stuff here',
                    execute: (ctx) => guard.isVoiceChannel(ctx.channel)
                },
                {
                    parameters: ['channel', 'quiet?'],
                    description: 'Checks if `channel` is a voice channel. If it cannot be found returns `No channel found`, or `false` if `quiet` is `true`.',
                    exampleCode: '{isvoice;blarg podcats}',
                    exampleOut: 'true',
                    execute: (ctx, [channel, quiet]) => this.isVoiceChannel(ctx, channel.value, quiet.value !== '')
                }
            ]
        });
    }

    public async isVoiceChannel(
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
        return guard.isVoiceChannel(channel);
    }
}
