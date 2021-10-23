import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class TagAuthorizerSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'tagauthorizer',
            category: SubtagType.SIMPLE,
            aliases: ['ccauthorizer'],
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns the user ID of the tag/cc authorizer',
                    exampleCode: '{username;{tagauthorizer}} authorized this tag!',
                    exampleOut: 'stupid cat authorized this tag!',
                    execute: (ctx) => ctx.authorizer
                }
            ]
        });
    }
}
