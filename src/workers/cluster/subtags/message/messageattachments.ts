import { BaseSubtag, BBTagContext, ChannelNotFoundError, NoMessageFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class MessageAttachmentsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messageattachments',
            category: SubtagType.MESSAGE,
            aliases: ['attachments'],
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns an array of attachments of the invoking message.',
                    exampleCode: 'You sent the attachments "{messageattachments}"',
                    exampleOut: 'You sent the attachments "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    execute: (ctx) => ctx.message.attachments.map(a => a.url)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns an array of attachments of `messageid` in the current channel',
                    exampleCode: 'Someone sent a message with attachments: "{messageattachments;1111111111111}"',
                    exampleOut: 'Someone sent a message with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    execute: (ctx, args) => this.getMessageAttachments(ctx, ctx.channel.id, args[0].value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns an array of attachments of `messageid` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleCode: 'Someone sent a message in #support with attachments: "{messageattachments;support;1111111111111}"',
                    exampleOut: 'Someone sent a message in #support with attachments: "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"',
                    execute: (ctx, args) => this.getMessageAttachments(ctx, args[0].value, args[1].value, args[2].value !== '')
                }
            ]
        });
    }

    public async getMessageAttachments(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quiet: boolean
    ): Promise<string[]> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            if (quiet)
                return [];
            throw new ChannelNotFoundError(channelStr);
        }
        let message: Message | undefined;
        try {
            message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                throw new NoMessageFoundError(messageStr);
            return message.attachments.map(a => a.url);
        } catch (e: unknown) {
            throw new NoMessageFoundError(messageStr);
        }

    }
}
