import { BaseSubtag, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class RoundSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'round',
            category: SubtagType.MATH,
            definition: [
                {
                    type: 'constant',
                    parameters: ['number'],
                    description: 'Rounds `number` to the nearest whole number.',
                    exampleCode: '{round;1.23}',
                    exampleOut: '1',
                    execute: (_, [number]) => this.round(number.value)
                }
            ]
        });
    }

    public round(value: string): number {
        const number = parse.float(value);
        if (isNaN(number))
            throw new NotANumberError(value);
        return Math.round(number);
    }
}
