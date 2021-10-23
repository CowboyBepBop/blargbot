import { BaseSubtag, BBTagContext, BBTagRuntimeError, NoRoleFoundError } from '@cluster/bbtag';
import { discordUtil, parse, SubtagType } from '@cluster/utils';

export class RoleSetPosSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesetpos',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: ['role', 'position', 'quiet?'],
                    description: 'Sets the position of `role`. ' +
                        'If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role is now at position 3. {rolesetpos;admin;3}',
                    exampleOut: 'The admin role is now at position 3.',
                    execute: (ctx, [role, position, quiet]) => this.setRolePos(ctx, role.value, position.value, quiet.value)
                }
            ]
        });
    }

    public async setRolePos(context: BBTagContext, roleStr: string, posStr: string, quietStr: string): Promise<string> {
        const topRole = discordUtil.getRoleEditPosition(context);
        if (topRole === 0)
            throw new BBTagRuntimeError('Author cannot edit roles');

        const quiet = quietStr !== '' || (context.scope.quiet ?? false);
        const role = await context.queryRole(roleStr, { noLookup: quiet });
        const pos = parse.int(posStr);

        if (role === undefined)
            throw new NoRoleFoundError(roleStr);

        if (role.position >= topRole)
            throw new BBTagRuntimeError('Role above author');
        if (pos >= topRole)
            throw new BBTagRuntimeError('Desired position above author');

        try {
            await role.edit({ position: pos });
        } catch (err: unknown) {
            if (!quiet)
                throw new BBTagRuntimeError('Failed to edit role: no perms');
        }
        return '`Role not found`'; //TODO meaningful output, this is purely for backwards compatibility :/
    }
}
