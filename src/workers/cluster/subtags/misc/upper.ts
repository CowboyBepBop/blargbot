import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UpperSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'upper',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['text'],
                    description: 'Returns `text` as uppercase.',
                    exampleCode: '{upper;this will become uppercase}',
                    exampleOut: 'THIS WILL BECOME UPPERCASE',
                    execute: (_, [text]) => text.value.toUpperCase()
                }
            ]
        });
    }
}
