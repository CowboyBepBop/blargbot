import { BaseSubtag, BBTagContext, BBTagRuntimeError, NoUserFoundError } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';
import { Constants, DiscordAPIError } from 'discord.js';

export class UserSetNickSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usersetnick',
            category: SubtagType.USER,
            aliases: ['setnick'],
            definition: [
                {
                    parameters: ['nick', 'user?'],
                    description: 'Sets `user`\'s nickname to `nick`. Leave `nick` blank to reset their nickname.',
                    exampleCode: '{usersetnick;super cool nickname}\n{//;Reset the the nickname}\n{usersetnick;}',
                    exampleOut: '', //TODO meaningful output
                    execute: (ctx, [nickname, user]) => this.setNickname(ctx, user.value, nickname.value)
                }
            ]
        });
    }
    public async setNickname(context: BBTagContext, userStr: string, nickname: string): Promise<undefined> {
        const user = userStr === '' ? context.user : await context.queryUser(userStr);
        if (user === undefined)
            throw new NoUserFoundError(userStr);

        const member = await context.util.getMember(context.guild, user.id);

        try {
            if (user.id === context.discord.user.id)
                await member?.setNickname(nickname);
            else {
                const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
                await member?.setNickname(nickname, fullReason);
            }
            return undefined;
        } catch (err: unknown) {
            if (err instanceof DiscordAPIError && err.code === Constants.APIErrors.MISSING_PERMISSIONS)
                throw new BBTagRuntimeError('Could not change nickname', 'I dont have permission to change the users nickname');
            throw err;
        }
    }
}
