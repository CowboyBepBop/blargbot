import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildMembersSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'guildmembers',
            category: SubtagType.GUILD,
            desc: 'Returns an array of user IDs of the members on the current guild. This only includes **cached** members, for getting the amount of members in a guild **always** use `{guildsize}`',
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    exampleCode: 'This guild has {length;{guildmembers}} members.',
                    exampleOut: 'This guild has 123 members.',
                    execute: (ctx) => ctx.guild.members.cache.map(m => m.user.id)
                }
            ]
        });
    }
}
