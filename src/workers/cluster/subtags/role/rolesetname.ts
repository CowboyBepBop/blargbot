import { BaseSubtag, BBTagContext, BBTagRuntimeError, NoRoleFoundError } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleSetNameSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesetname',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: 'Remove the name of `role`',
                    exampleCode: '{rolesetname;admin}',
                    exampleOut: '', //TODO meaningful output
                    execute: (ctx, [role]) => this.setRolename(ctx, role.value, '', false)
                },
                {
                    parameters: ['role', 'name', 'quiet?'],
                    description: 'Sets the name of `role`.' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is now called administrator. {rolesetname;admin;administrator}',
                    exampleOut: 'The admin role is now called administrator.',
                    execute: (ctx, [role, name, quiet]) => this.setRolename(ctx, role.value, name.value, quiet.value !== '')
                }
            ]
        });
    }

    public async setRolename(
        context: BBTagContext,
        roleStr: string,
        name: string,
        quiet: boolean
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });

        if (role === undefined)
            throw new NoRoleFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
            await role.edit({ name }, fullReason);
            return ''; //TODO meaningful output
        } catch (err: unknown) {
            if (!quiet)
                throw new BBTagRuntimeError('Failed to edit role: no perms');
            throw new NoRoleFoundError(roleStr);
        }
    }
}
