import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ZwsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'zws',
            category: SubtagType.SIMPLE,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Returns a single zero width space (unicode 200B)',
                    exampleCode: '{zws}',
                    exampleOut: '\u200B',
                    execute: () => '\u200B'
                }
            ]
        });
    }
}
