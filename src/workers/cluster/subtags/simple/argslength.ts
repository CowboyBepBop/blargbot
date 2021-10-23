import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class Argslength extends BaseSubtag {
    public constructor() {
        super({
            name: 'argslength',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Return the number of arguments the user provided.',
                    exampleCode: 'You said {argslength} words.',
                    exampleIn: 'I am saying things.',
                    exampleOut: 'You said 4 words.',
                    execute: ctx => ctx.input.length
                }
            ]
        });
    }
}
