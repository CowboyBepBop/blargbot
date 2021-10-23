import { BaseSubtag, BBTagContext, BBTagRuntimeError, UserNotInGuildError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import moment from 'moment-timezone';

export class UserBoostDataSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userboostdate',
            category: SubtagType.USER,
            desc: 'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information about formats. ' +
                'If user is not boosting the guild, returns `User not boosting`',
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: 'Returns the date that the executing user started boosting the guild using `format` for the output, in UTC+0.',
                    exampleCode: 'Your account started boosting this guild on {userboostdate;YYYY/MM/DD HH:mm:ss}',
                    exampleOut: 'Your account started boosting this guild on 2020/02/27 00:00:00',
                    execute: (ctx, [format]) => this.getUserBoostingDate(ctx, '', format.value, '')
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the date that `user` started boosting the current guild using `format` for the output, in UTC+0. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: '{if;{isuserboosting;stupid cat};stupid cat is boosting!; no boosting here :(}',
                    exampleOut: 'stupid cat is boosting!',
                    execute: (ctx, [format, user, quiet]) => this.getUserBoostingDate(ctx, user.value, format.value, quiet.value)
                }
            ]
        });
    }

    public async getUserBoostingDate(context: BBTagContext, userStr: string | undefined, format: string, quietStr: string): Promise<string | undefined> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
        const user = userStr === undefined ? context.user : await context.queryUser(userStr, { noErrors: context.scope.noLookupErrors, noLookup: quiet });

        if (user === undefined)
            // TODO throw new NoUserFoundError(userStr);
            return undefined;

        const member = await context.util.getMember(context.guild, user.id);
        if (member === undefined)
            throw new UserNotInGuildError(user);

        const boostDate = member.premiumSinceTimestamp;
        if (boostDate === null)
            throw new BBTagRuntimeError('User not boosting');

        return moment(boostDate).format(format);
    }
}
