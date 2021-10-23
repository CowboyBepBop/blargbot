import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetColorSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesetcolor',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role'],
                    description: 'Sets the color of `role` to \'#000000\'. This is transparent.',
                    exampleCode: 'The admin role is now colourless. {rolesetcolor;admin}',
                    exampleOut: 'The admin role is now colourless.',
                    execute: (ctx, [role]) => this.setRolecolor(ctx, role.value, '', false)
                },
                {
                    parameters: ['role', 'color', 'quiet?'],
                    description: 'Sets the `color` of `role`.' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing',
                    exampleCode: 'The admin role is now white. {rolesetcolor;admin;white}',
                    exampleOut: 'The admin role is now white.',
                    execute: (ctx, [role, color, quiet]) => this.setRolecolor(ctx, role.value, color.value, quiet.value !== '')
                }
            ]
        });
    }

    public async setRolecolor(
        context: BBTagContext,
        roleStr: string,
        colorStr: string,
        quiet: boolean
    ): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        quiet ||= context.scope.quiet ?? false;
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const color = parse.color(colorStr !== '' ? colorStr : 0);

        if (role !== undefined) {
            if (role.position >= topRole)
                throw new BBTagRuntimeError('Role above author');

            try {
                const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
                await role.edit({ color }, fullReason);
                return ''; //TODO meaningful output
            } catch (err: unknown) {
                if (!quiet)
                    throw new BBTagRuntimeError('Failed to edit role: no perms');
            }
        }
        throw new BBTagRuntimeError('Role not found'); //TODO NoRoleFoundError instead
    }
}
