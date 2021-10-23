import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class IsArraySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'isarray',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['text'],
                    description: 'Determines whether `text` is a valid array.',
                    exampleCode: '{isarray;["array?"]} {isarray;array?}',
                    exampleOut: 'true false',
                    execute: (_, [array]) => this.isArray(array.value)
                }
            ]
        });
    }

    public isArray(arrayStr: string): boolean {
        const { v: array } = bbtagUtil.tagArray.deserialize(arrayStr) ?? {};
        return array !== undefined;
    }
}
