import { Emote } from '@blargbot/core/Emote';
import { clamp, discord, guard, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

const defaultCondition = bbtag.parse('true');

export class WaitReactionSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'waitreaction',
            category: SubtagType.MESSAGE,
            aliases: ['waitreact'],
            description: 'Pauses the command until one of the given `users` adds any given `reaction` on any of the given `messages`. ' +
                'When a `reaction` is added, `condition` will be run to determine if the reaction can be accepted. ' +
                'If no reaction has been accepted within `timeout` then the subtag returns `Wait timed out`, otherwise it returns an array containing ' +
                'the channel Id, the message Id, the user id and the reaction, in that order. ' +
                '\n\n`userIDs` defaults to the current user if left blank or omitted.' +
                '\n`reactions` defaults to any reaction if left blank or omitted.' +
                '\n`condition` must return `true` or `false`' +
                '\n`timeout` is a number of seconds. This is limited to 300' +
                '\n\n While inside the `condition` parameter, none of the following subtags may be used: `' + bbtag.overrides.waitreaction.join(', ') + '`' +
                '\nAlso, the current message becomes the message the reaction was added to, and the user becomes the person who sent the message. ' +
                'This means that `{channelid}`, `{messageid}`, `{userid}` and all related subtags will change their values.' +
                '\nFinally, while inside the `condition` parameter, you can use the temporary subtag `{reaction}` to get the current reaction ' +
                'and the `{reactuser}` temporary subtag to get the user who reacted.\n' +
                '`messages`, `users` and `reactions` can either be single values eg: `{waitreact;1234567891234;stupid cat;🤔}`, or they can be arrays eg: `{waitreact;["1234567891234","98765432219876"];stupid cat;["🤔"]}',
            definition: [
                {
                    parameters: ['messages', 'userIDs?'],
                    description: 'Waits for any reaction on `messages` from the executing user or `userIDs` if provided.',
                    exampleCode: '{waitreaction;12345678912345;stupid cat}',
                    exampleIn: '(reaction is added)',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","🤔"]',
                    returns: 'id[]',
                    execute: (ctx, [messages, userIDs]) => this.awaitReaction(ctx, messages.value, userIDs.value)
                },
                {
                    parameters: ['messages', 'userIDs', 'reactions', '~condition?:true'],
                    description: 'Waits for any of `reactions` on `messages` from `userIDs`, if `condition` returns `true` this will return the response array.',
                    exampleCode: '{waitreaction;12345678912345;{userid;stupid cat};["🤔", "👀"];{bool;{reaction};==;👀}}',
                    exampleIn: '(🤔 was reacted)\n(👀 was reacted)',
                    exampleOut: '["111111111111111","12345678912345","3333333333333","👀"]',
                    returns: 'string[]',
                    execute: (ctx, [messages, userIDs, reactions, condition]) => this.awaitReaction(ctx, messages.value, userIDs.value, reactions.value, condition.code, '60')
                },
                {
                    parameters: ['messages', 'userIDs', 'reactions', '~condition:true', 'timeout:60'],
                    description: 'Waits for any of `reactions` on `messages` from `userIDs`, if `condition` returns `true` this will return the response array. If no reaction was matched within `timeout`, `Wait timed out` will be returned.',
                    exampleCode: '{waitreaction;12345678912345;["{userid;stupid cat}","{userid;titansmasher}"];["🤔", "👀"];;120}',
                    exampleIn: '(some random user reacted with 🤔)\n(titansmasher reacted with 🤔)',
                    exampleOut: '["111111111111111","12345678912345","135556895086870528","🤔"]',
                    returns: 'string[]',
                    execute: (ctx, [messages, userIDs, reactions, condition, timeout]) => this.awaitReaction(ctx, messages.value, userIDs.value, reactions.value, condition.code, timeout.value)
                }
            ]
        });
    }

    public async awaitReaction(
        context: BBTagContext,
        messageStr: string,
        userIDStr: string,
        reactions = '',
        condition = defaultCondition,
        timeoutStr = '60'
    ): Promise<[channelId: string, messageId: string, userId: string, emoji: string]> {
        const messages = bbtag.tagArray.flattenArray([messageStr]).map(i => parse.string(i));
        const users = await this.bulkLookup(userIDStr, i => context.queryUser(i, { noErrors: true, noLookup: true }), UserNotFoundError)
            ?? [context.user];

        // parse reactions
        let parsedReactions: Emote[] | undefined;
        if (reactions !== '') {
            parsedReactions = bbtag.tagArray.flattenArray([reactions]).map(i => parse.string(i)).flatMap(i => Emote.findAll(i));
            parsedReactions = [...new Set(parsedReactions)];
            if (parsedReactions.length === 0)
                throw new BBTagRuntimeError('Invalid Emojis');
        } else {
            parsedReactions = undefined;
        }

        const timeout = clamp(parse.float(timeoutStr), 0, 300);
        if (isNaN(timeout))
            throw new NotANumberError(timeoutStr);

        const userSet = new Set(users.map(u => u.id));
        const reactionSet = new Set(parsedReactions?.map(r => r.toString()));
        const checkReaction = reactionSet.size === 0 ? () => true : (emoji: Emote) => reactionSet.has(emoji.toString());
        const result = await context.util.awaitReaction(messages, async ({ user, reaction, message }) => {
            if (!userSet.has(user.id) || !checkReaction(reaction) || !guard.isGuildMessage(message))
                return false;

            const result = await context.withScope(scope => {
                scope.reaction = reaction.toString();
                scope.reactUser = user.id;
                return context.withChild({ message }, context => context.eval(condition));
            });
            return parse.boolean(result, false);
        }, timeout * 1000);

        if (result === undefined)
            throw new BBTagRuntimeError(`Wait timed out after ${timeout * 1000}`);

        return [result.message.channel.id, result.message.id, result.user.id, discord.emojiString(result.reaction)];
    }
}
