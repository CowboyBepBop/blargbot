import { BaseSubtag, BBTagContext, NoRoleFoundError } from '@cluster/bbtag';
import { /*parse,*/ SubtagType } from '@cluster/utils'; //TODO uncomment parse module for new code

export class RoleSizeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rolesize',
            category: SubtagType.ROLE,
            aliases: ['inrole'],
            definition: [
                {
                    parameters: ['role'/*, 'quiet?:false'*/], //TODO uncomment quiet parameter for new code
                    description: 'Returns the amount of people in role `role`',
                    exampleCode: 'There are {rolesize;11111111111111111} people in the role!',
                    exampleOut: 'There are 5 people in the role!',
                    execute: (ctx, [role/*, quiet */]) => this.getRoleSize(ctx, role.value/*, quiet.value */)
                }
            ]
        });
    }

    public async getRoleSize(context: BBTagContext, roleStr: string /*, quietStr: string */): Promise<number> {
        const role = await context.util.getRole(context.guild.id, roleStr);

        if (role === undefined)
            throw new NoRoleFoundError(roleStr);
        return context.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;

        //TODO new execute code which is more consistent with other role subtags
        //     const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : parse.boolean(quietStr);
        //     const role = await context.getRole(roleStr, {
        //         quiet, suppress: context.scope.suppressLookup,
        //         label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
        //     });

        // if (role === undefined)
        //         return this.noRoleFound(context, subtag);
        //     return context.guild.members.filter(m => m.roles.includes(role.id)).length.toString();
        // }
    }
}
