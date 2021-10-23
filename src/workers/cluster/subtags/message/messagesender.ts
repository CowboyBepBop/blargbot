import { BaseSubtag, BBTagContext, ChannelNotFoundError, NoMessageFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class MessageSenderSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messagesender',
            category: SubtagType.MESSAGE,
            aliases: ['sender'],
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns the id of the author of the executing message.',
                    exampleCode: 'That was sent by "{sender}"',
                    exampleOut: 'That was sent by "1111111111111"',
                    execute: (ctx) => ctx.message.author.id
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns the id of the author of `messageid` in the current channel.',
                    exampleCode: 'Message 1111111111111 was sent by {sender;1111111111111}',
                    exampleOut: 'Message 1111111111111 was sent by 2222222222222',
                    execute: (ctx, args) => this.getMessageSender(ctx, ctx.channel.id, args[0].value, false)
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns the id of the author of `messageid` in `channel`. If `quiet` is provided and `channel` cannot be found, this will return nothing.',
                    exampleCode: 'Message 1111111111111 in #support was sent by {sender;support;1111111111111}',
                    exampleOut: 'Message 1111111111111 in #support was sent by 2222222222222',
                    execute: (ctx, args) => this.getMessageSender(ctx, args[0].value, args[1].value, args[2].value !== '')
                }
            ]
        });
    }

    public async getMessageSender(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quiet: boolean
    ): Promise<string | undefined> {
        quiet ||= context.scope.quiet ?? false;
        const channel = await context.queryChannel(channelStr, { noLookup: quiet });
        if (channel === undefined) {
            if (quiet)
                return undefined;
            throw new ChannelNotFoundError(channelStr);
        }
        let message: Message | undefined;
        try {
            message = await context.util.getMessage(channel, messageStr);
            if (message === undefined)
                throw new NoMessageFoundError(messageStr);
            return message.author.id;
        } catch (e: unknown) {
            throw new NoMessageFoundError(messageStr);
        }
    }
}
