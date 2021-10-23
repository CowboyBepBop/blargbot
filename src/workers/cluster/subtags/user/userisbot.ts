import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserIsBotSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userisbot',
            category: SubtagType.USER,
            aliases: ['userbot'],
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns whether the executing user is a bot.',
                    exampleCode: 'Are you a bot? {userisbot}',
                    exampleOut: 'Are you a bot? false',
                    execute: (ctx) => ctx.user.bot
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns whether a `user` is a bot. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Is Stupid cat a bot? {userisbot;Stupid cat}',
                    exampleOut: 'Stupid cat\'s username is Stupid cat!',
                    execute: (ctx, [userId, quiet]) => this.getUserIsBot(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserIsBot(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<boolean | undefined> {
        quiet ||= context.scope.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined) {
            return user.bot;
        }

        return quiet ? undefined : undefined; //TODO add behaviour for this????
    }
}
