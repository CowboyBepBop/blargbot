import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import moment from 'moment-timezone';

export class UserCreateDatSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usercreatedat',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: 'Returns the account creation date of the executing user in `format`.',
                    exampleCode: 'Your account was created on {usercreatedat}',
                    exampleOut: 'Your account was created on 2017-02-06T18:58:10+00:00',
                    execute: (ctx, [format]) => this.userCreatedAt(ctx, '', format.value, '')
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the account creation date of `user` in `format`. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s account was created on {usercreatedat;;Stupid cat}',
                    exampleOut: 'Stupid cat\'s account was created on 2015-10-13T04:27:26Z',
                    execute: (ctx, [format, user, quiet]) => this.userCreatedAt(ctx, user.value, format.value, quiet.value)
                }
            ]
        });
    }

    public async userCreatedAt(context: BBTagContext, userStr: string, format: string, quietStr: string): Promise<string | undefined> {
        const quiet = quietStr !== '' || (context.scope.quiet ?? false);
        const user = userStr === '' ? context.user : await context.queryUser(userStr, { noLookup: quiet });

        if (user === undefined)
            //throw new NoUserFoundError(userStr);
            return undefined;

        return moment(user.createdAt).utcOffset(0).format(format);
    }
}
