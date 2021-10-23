import { BaseSubtag, BBTagContext, BBTagRuntimeError, NoRoleFoundError, NoUserFoundError } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleRemoveSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roleremove',
            category: SubtagType.ROLE,
            aliases: ['removerole'],
            desc: '`role` can be either a roleID or role mention.',
            definition: [
                {
                    parameters: ['role'],
                    description: 'Removes `role` from the executing user. Returns `true` if role was removed, else an error will be shown.',
                    exampleCode: 'No more role! {roleremove;11111111111111111}',
                    exampleOut: 'No more role! true',
                    execute: (ctx, [role]) => this.removeRole(ctx, role.value, ctx.user.id, '')
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: 'Remove the chosen `role` from  `user`. Returns `true` if role was removed, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleCode: 'Stupid cat no more role! {roleremove;Bot;Stupid cat}',
                    exampleOut: 'Stupid cat no more role! true',
                    execute: (ctx, [role, user, quiet]) => this.removeRole(ctx, role.value, user.value, quiet.value)
                }
            ]
        });
    }

    public async removeRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quietStr: string
    ): Promise<boolean> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot remove roles');

        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
        const result = await discordUtil.checkRoles(context, roleStr, userStr, quiet);

        if (result.member === undefined) {
            if (quiet)
                return false;
            throw new NoUserFoundError(userStr);
        }

        if (result.roles.length === 0)
            throw new NoRoleFoundError(roleStr);

        if (result.roles.find(role => role.position >= topRole) !== undefined)
            throw new BBTagRuntimeError('Role above author');

        const roles = result.roles.filter((_, i) => result.hasRole[i]);

        if (roles.length === 0)
            return false;

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
            for (const role of roles)
                await result.member.roles.remove(role, fullReason);
            return true;
        } catch (err: unknown) {
            context.logger.error(err);
            return false;
        }
    }
}
