import { BaseSubtag, BBTagContext, ChannelNotFoundError, NoMessageFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { Message, MessageEmbedOptions } from 'discord.js';

export class MessageEmbedsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messageembeds',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns an array of embeds of the invoking message.',
                    exampleCode: 'You sent an embed: "{messageembeds}"',
                    exampleOut: 'You sent an embed: "[{"title":"Hello!"}]"',
                    execute: (ctx) => ctx.message.embeds.map(e => e.toJSON() as JObject)
                },
                {
                    parameters: ['messageid'],
                    description: 'Returns an array of embeds of `messageid` in the current channel',
                    exampleCode: 'Someone sent a message with embeds: "{messageembeds;1111111111111}"',
                    exampleOut: 'Someone sent a message with attachments: "[{"title":"Hello!"}]"',
                    execute: (ctx, args) => this.getMessageEmbeds(ctx, ctx.channel.id, args[0].value, false) as Promise<JArray>
                },
                {
                    parameters: ['channel', 'messageid', 'quiet?'],
                    description: 'Returns an array of embeds of `messageid` from `channel`. If `quiet` is provided and `channel` cannot be found, this will return an empty array.',
                    exampleCode: 'Someone sent a message in #support with embeds: "{messageembeds;support;1111111111111}"',
                    exampleOut: 'Someone sent a message in #support with embeds: "[{"title":"Hello!"}]"',
                    execute: (ctx, args) => this.getMessageEmbeds(ctx, args[0].value, args[1].value, args[2].value !== '') as Promise<JArray>
                }
            ]
        });
    }

    public async getMessageEmbeds(
        context: BBTagContext,
        channelStr: string,
        messageStr: string,
        quiet: boolean
    ): Promise<MessageEmbedOptions[]> {
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
            return message.embeds.map(e => e.toJSON() as MessageEmbedOptions);
        } catch (e: unknown) {
            throw new NoMessageFoundError(messageStr);
        }

    }
}
