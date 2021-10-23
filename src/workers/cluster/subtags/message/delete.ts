import { BaseSubtag, BBTagContext, BBTagRuntimeError, ChannelNotFoundError, NoMessageFoundError } from '@cluster/bbtag';
import { guard, SubtagType } from '@cluster/utils';
import { Message } from 'discord.js';

export class DeleteSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'delete',
            desc: 'Only ccommands can delete other messages.',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: 'Deletes the message that invoked the command',
                    exampleIn: '{//;The message that triggered this will be deleted} {delete}',
                    exampleOut: '(the message got deleted idk how to do examples for this)',
                    execute: (ctx) => this.deleteMessage(ctx, ctx.channel.id, ctx.message.id)
                },
                {
                    parameters: ['messageId'],
                    description: 'Deletes the specified `messageId` from the current channel.',
                    exampleIn: '{//;The message with ID `111111111111111111` will be deleted}\n{delete;111111111111111111}',
                    exampleOut: '(the message `111111111111111111` got deleted idk how to do examples for this)',
                    execute: (ctx, [messageId]) => this.deleteMessage(ctx, ctx.channel.id, messageId.value)
                },
                {
                    parameters: ['channel', 'messageId'],
                    description: 'Deletes the specified `messageId` from channel `channel`.',
                    exampleIn: '{//;The message with ID `2222222222222222` from channel `1111111111111111` will be deleted}\n{delete;111111111111111111;2222222222222222}',
                    exampleOut: '(the message `2222222222222222` from channel `1111111111111111` got deleted)',
                    execute: (ctx, [channel, messageId]) => this.deleteMessage(ctx, channel.value, messageId.value)
                }
            ]
        });
    }

    public async deleteMessage(
        context: BBTagContext,
        channelStr: string,
        messageId: string
    ): Promise<undefined> {
        if (!(await context.isStaff || context.ownsMessage(messageId)))
            throw new BBTagRuntimeError('Author must be staff to delete unrelated messages');

        const channel = await context.queryChannel(channelStr);
        let msg: Message | undefined;
        if (channel === undefined)
            throw new ChannelNotFoundError(channelStr);
        if (messageId.length > 0 && guard.isTextableChannel(channel)) {
            msg = await context.util.getMessage(channel.id, messageId);
            if (msg === undefined)
                throw new NoMessageFoundError(messageId);
        } else {
            throw new NoMessageFoundError(messageId);
        }

        /**
         * * This was used in messageDelete event? Not sure what it's purpose is tbh.
         * * bu.commandMessages seems to also be a thing
         */
        // if (!bu.notCommandMessages[context.guild.id])
        //     bu.notCommandMessages[context.guild.id] = {};
        // bu.notCommandMessages[context.guild.id][context.msg.id] = true;

        try {
            await msg.delete();
        } catch (e: unknown) {
            // NO-OP
        }
        //TODO return something like true/false
        return undefined;
    }
}
