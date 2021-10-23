import { BaseSubtag, BBTagContext, BBTagRuntimeError, NoMessageFoundError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';
import { DiscordAPIError, EmbedFieldData, MessageEmbedOptions } from 'discord.js';

export class ReactRemoveSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'reactremove',
            category: SubtagType.MESSAGE,
            aliases: ['removereact'],
            definition: [//! overwritten
                {
                    parameters: ['channelID?', 'messageID'], // [channelID];<messageID>;[user];[reactions...]
                    execute: (ctx, args) => this.removeReactions(ctx, args.map(arg => arg.value))
                },
                {
                    parameters: ['channelID', 'messageID', 'user', 'reactions+'], // [channelID];<messageID>;[user];[reactions...]
                    execute: (ctx, args) => this.removeReactions(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async removeReactions(context: BBTagContext, args: string[]): Promise<undefined> {
        let channel;
        let message;
        let messageStr;
        // Check if the first "emote" is actually a valid channel
        channel = await context.queryChannel(args[0], { noLookup: true });
        if (channel === undefined)
            channel = context.channel;
        else
            args.shift();

        const permissions = channel.permissionsFor(context.discord.user);
        if (permissions === null || !permissions.has('MANAGE_MESSAGES'))
            throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');
        // Check that the current first "emote" is a message id
        try {
            message = await context.util.getMessage(channel, messageStr = args[0]);
        } catch (e: unknown) {
            // NOOP
        }
        args.shift();
        if (message === undefined)
            throw new NoMessageFoundError(messageStr);

        if (!(await context.isStaff || context.ownsMessage(message.id)))
            throw new BBTagRuntimeError('Author must be staff to modify unrelated messages');

        // Loop through the "emotes" and check if each is a user. If it is not, then break
        let user = await context.queryUser(args[0], { noErrors: context.scope.noLookupErrors, noLookup: true });
        if (user === undefined)
            user = context.user;
        else
            args.shift();
        // Find all actual emotes in remaining emotes
        let parsedEmojis = parse.emoji(args.join('|'), true);

        if (parsedEmojis.length === 0 && args.length !== 0)
            throw new BBTagRuntimeError('Invalid Emojis');

        // Default to all emotes
        if (parsedEmojis.length === 0)
            parsedEmojis = [...message.reactions.cache.keys()];

        const errored = [];
        for (const reaction of parsedEmojis) {
            if (!message.reactions.cache.has(reaction))
                continue;

            await context.limit.check(context, 'reactremove:requests');
            try {
                await message.reactions.cache.get(reaction)?.users.remove(user);
            } catch (err: unknown) {
                if (!(err instanceof DiscordAPIError))
                    throw err;

                switch (err.code) {
                    case 10014:
                        errored.push(reaction);
                        continue;
                    case 50013:
                        throw new BBTagRuntimeError('I need to be able to Manage Messages to remove reactions');
                }
                throw err;
            }
        }

        if (errored.length > 0)
            throw new BBTagRuntimeError('Unknown Emoji: ' + errored.join(', '));

        return undefined;
    }

    public enrichDocs(embed: MessageEmbedOptions): MessageEmbedOptions {
        const limitField = <EmbedFieldData>embed.fields?.pop();

        embed.fields = [
            {
                name: 'Usage',
                value: '```\n{reactremove;[channelID];<messageID>}```\n`channelID` defaults to the current channel if omitted\n\n' +
                    'Removes all reactions of the executing user from `messageID` in `channelID`.\n\n' +
                    '**Example code:**\n> {reactremove;12345678901234}\n' +
                    '**Example out:**\n> (removed all reactions on 12345678901234)'
            },
            {
                name: '\u200b',
                value: '```\n{reactremove;[channelID];<messageID>;<user>;[reactions]}```\n`channelID` defaults to the current channel if omitted\n' +
                    '`reactions` defaults to all reactions if left blank or omitted\n\n' +
                    'Removes `reactions` `user` reacted on `messageID` in `channelID`.\n' +
                    '**Example code:**\n> {reactremove;12345678901234;111111111111111111;🤔}\n' +
                    '**Example out:**\n> (removed the 🤔 reaction on 12345678901234 from user 111111111111111111)'
            },
            {
                ...limitField
            }
        ];

        return embed;
    }
}
