import { BBTagContext } from '@cluster/bbtag';
import { bbtagUtil } from '@cluster/utils';
import { GuildMember, Role } from 'discord.js';

interface CheckRolesResult {
    member: GuildMember | undefined;
    roles: Role[];
    hasRole: boolean[];
}

export async function checkRoles(
    context: BBTagContext,
    roleStr: string,
    userStr: string,
    quiet: boolean
): Promise<CheckRolesResult> {
    const roleExpr = /(\d{17,23})/;
    const deserialized = bbtagUtil.tagArray.deserialize(roleStr, false);
    const result: CheckRolesResult = {
        member: context.member,
        roles: [],
        hasRole: []
    };
    if (userStr !== '')
        result.member = await context.queryMember(userStr, { noLookup: quiet });

    const roles = deserialized?.map(v => v?.toString() ?? 'null') ?? [roleStr];
    for (const entry of roles) {
        const match = roleExpr.exec(entry);
        const role = context.guild.roles.cache.get(match !== null ? match[1] : ''); //TODO context.getRole
        if (role === undefined)
            continue;
        result.roles.push(role);
    }

    result.hasRole = result.roles.map(role => {
        if (result.member !== undefined)
            return result.member.roles.cache.has(role.id);
        return false;
    });
    return result;
}
