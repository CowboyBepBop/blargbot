import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RbSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rb',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns `}`',
                    exampleCode: 'This is a bracket! {rb}',
                    exampleOut: 'This is a bracket! }',
                    execute: () => '}'
                }
            ]
        });
    }
}
