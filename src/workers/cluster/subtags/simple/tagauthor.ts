import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class TagAuthorSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'tagauthor',
            category: SubtagType.SIMPLE,
            aliases: ['ccauthor'],
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns the user ID of the tag/cc author',
                    exampleCode: 'This tag was created by {username;{tagauthor}}',
                    exampleOut: 'This tag was created by stupid cat',
                    execute: (ctx) => ctx.author
                }
            ]
        });
    }
}
