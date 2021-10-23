import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildSizeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'guildsize',
            aliases: ['inguild'],
            category: SubtagType.GUILD,
            desc: 'Returns the number of members on the current guild.',
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    exampleCode: 'This guild has {guildsize} members.',
                    exampleOut: 'This guild has 123 members.',
                    execute: (ctx) => ctx.guild.memberCount
                }
            ]
        });
    }
}
