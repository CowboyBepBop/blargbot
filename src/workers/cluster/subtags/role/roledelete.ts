import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';

export class RoleDeleteSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roledelete',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Deletes `role`. If `quiet` is specified, if `role` can\'t be found it will return nothing.\nWarning: this subtag is able to delete roles managed by integrations.',
                    exampleCode: '{roledelete;Super Cool Role!}',
                    exampleOut: '(rip no more super cool roles for anyone)',
                    execute: (ctx, [role, quiet]) => this.deleteRole(ctx, role.value, quiet.value)
                }
            ]
        });
    }

    public async deleteRole(context: BBTagContext, roleStr: string, quietStr: string): Promise<undefined> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot delete roles');

        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
        const role = await context.queryRole(roleStr, {
            noErrors: quiet,
            noLookup: quiet
        });

        if (role === undefined)
            return undefined;

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');

        try {
            const reason = discordUtil.formatAuditReason(context.user, context.scope.reason);
            await role.delete(reason);
            //TODO meaningful output
            return undefined;
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to delete role: no perms');
        }
    }
}
