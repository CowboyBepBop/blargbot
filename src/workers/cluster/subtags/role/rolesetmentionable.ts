import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetMentionableSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesetmentionable',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: 'Set `role` to mentionable.',
                    exampleCode: 'The admin role is now mentionable. {rolesetmentionable;admin}',
                    exampleOut: 'The admin role is now mentionable.',
                    execute: (ctx, [role]) => this.setRolementionable(ctx, role.value, 'true', false)
                },
                {
                    parameters: ['role', 'mentionable:true', 'quiet?'],
                    description: 'Sets whether `role` can be mentioned. `mentionable` can be either `true` to set the role as mentionable, ' +
                        'or anything else to set it to unmentionable. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is no longer mentionable. {rolesetmentionable;admin;false}',
                    exampleOut: 'The admin role is no longer mentionable.', //TODO output like true/false
                    execute: (ctx, [role, mentionable, quiet]) => this.setRolementionable(ctx, role.value, mentionable.value, quiet.value !== '')
                }
            ]
        });
    }

    public async setRolementionable(
        context: BBTagContext,
        roleStr: string,
        toggleStr: string,
        quiet: boolean
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const mentionable = parse.boolean(toggleStr, false);

        if (role !== undefined) {
            if (role.position >= topRole)
                throw new BBTagRuntimeError('Role above author');

            try {
                const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
                await role.edit({ mentionable }, fullReason);
                return ''; //TODO meaningful output
            } catch (err: unknown) {
                if (!quiet)
                    throw new BBTagRuntimeError('Failed to edit role: no perms');
            }
        }
        throw new BBTagRuntimeError('Role not found'); //TODO NoRoleFoundError instead
    }
}
