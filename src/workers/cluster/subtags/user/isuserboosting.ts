import { BaseSubtag, BBTagContext, UserNotInGuildError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { User } from 'discord.js';

export class IsUserBoostingSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'isuserboosting',
            category: SubtagType.USER,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns `true` if the executing user is boosting the guild and `false` if not.',
                    exampleCode: '{if;{isuserboosting};Yes you are boosting;You should consider boosting}',
                    exampleOut: 'You should consider boosting',
                    execute: (ctx) => ctx.member.premiumSinceTimestamp !== null
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `true` if the `user` is boosting the guild and `false` if not. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: '{if;{isuserboosting;stupid cat};stupid cat is boosting!; no boosting here :(}',
                    exampleOut: 'stupid cat is boosting!',
                    execute: (ctx, [user, quiet]) => this.isUserBoosting(ctx, user.value, quiet.value)
                }
            ]
        });
    }

    public async isUserBoosting(context: BBTagContext, userStr: string, quietStr: string): Promise<boolean | undefined> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
        let user: User | undefined = context.user;

        if (userStr !== '')
            user = await context.queryUser(userStr, {
                noErrors: context.scope.noLookupErrors,
                noLookup: quiet
            });

        if (user === undefined)
            // TODO throw new UserNotFoundError(userStr) ?
            return undefined;

        const member = await context.util.getMember(context.guild, user.id);
        if (member !== undefined)
            return member.premiumSinceTimestamp !== null;
        throw new UserNotInGuildError(user);

    }
}
