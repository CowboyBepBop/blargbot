import { BaseSubtag, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class RoundUpSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'roundup',
            category: SubtagType.MATH,
            aliases: ['ceil'],
            definition: [
                {
                    type: 'constant',
                    parameters: ['number'],
                    description: 'Rounds `number` up.',
                    exampleCode: '{roundup;1.23}',
                    exampleOut: '2',
                    execute: (_, [number]) => this.roundUp(number.value)
                }
            ]
        });
    }

    public roundUp(value: string): number {
        const number = parse.float(value);
        if (isNaN(number))
            throw new NotANumberError(value);
        return Math.ceil(number);
    }
}
