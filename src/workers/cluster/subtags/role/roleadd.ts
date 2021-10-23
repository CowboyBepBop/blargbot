import { BaseSubtag, BBTagContext, BBTagRuntimeError, NoRoleFoundError, NoUserFoundError } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleAddSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roleadd',
            category: SubtagType.ROLE,
            aliases: ['addrole'],
            desc: '`role` can be either a roleID or role mention.',
            definition: [
                {
                    parameters: ['role'],
                    description: 'Gives the executing user `role`. Returns `true` if role was given, else an error will be shown.',
                    exampleCode: 'Have a role! {roleadd;11111111111111111}',
                    exampleOut: 'Have a role! true',
                    execute: (ctx, [role]) => this.addRole(ctx, role.value, ctx.user.id, '')
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: 'Gives `user` the chosen `role`. Returns `true` if role was given, else an error will be shown. If `quiet` is specified, if a user can\'t be found it will simply return `false`',
                    exampleCode: 'Stupid cat have a role! {roleadd;Bot;Stupid cat}',
                    exampleOut: 'Stupid cat have a role! true',
                    execute: (ctx, [role, user, quiet]) => this.addRole(ctx, role.value, user.value, quiet.value)
                }
            ]
        });
    }

    public async addRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quietStr: string
    ): Promise<boolean> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot add roles');

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

        const roles = result.roles.filter((_, i) => !result.hasRole[i]);

        if (roles.length === 0)
            return false;

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
            for (const role of roles)
                await result.member.roles.add(role, fullReason);
            return true;
        } catch (err: unknown) {
            context.logger.error(err);
            return false;
        }
    }
}
