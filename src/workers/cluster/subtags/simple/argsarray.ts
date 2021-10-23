import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ArgsarraySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'argsarray',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Gets user input as an array.',
                    exampleCode: 'Your input was {argsarray}',
                    exampleIn: 'Hello world!',
                    exampleOut: 'Your input was ["Hello","world!"]',
                    execute: ctx => ctx.input
                }
            ]
        });
    }
}
