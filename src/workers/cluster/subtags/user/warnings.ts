import { BaseSubtag, BBTagContext, NoUserFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class WarningsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'warnings',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user?'],
                    description: 'Gets the number of warnings `user` has. `user` defaults to the user who executed the containing tag.',
                    exampleCode: 'You have {warnings} warning(s)!',
                    exampleOut: 'You have 0 warning(s)!',
                    execute: (ctx, [user]) => this.getWarnings(ctx, user.value)
                }
            ]
        });
    }

    public async getWarnings(context: BBTagContext, userStr: string): Promise<number> {
        const user = userStr === '' ? context.user : await context.queryUser(userStr);
        if (user === undefined)
            throw new NoUserFoundError(userStr);

        const storedGuild = await context.database.guilds.get(context.guild.id);
        if (storedGuild?.warnings !== undefined && storedGuild.warnings.users !== undefined && storedGuild.warnings.users[user.id] !== undefined)
            return storedGuild.warnings.users[user.id] ?? 0;
        return 0;
    }
}
