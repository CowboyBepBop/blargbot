import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class GuildIdSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'guildid',
            category: SubtagType.API,
            desc: 'Returns the id of the current guild.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The guild\'s id is {guildid}',
                    exampleOut: 'The guild\'s id is 1234567890123456',
                    execute: (ctx) => ctx.guild.id
                }
            ]
        });
    }
}