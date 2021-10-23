import { BaseSubtag, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class RoundDownSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'rounddown',
            category: SubtagType.MATH,
            aliases: ['floor'],
            definition: [
                {
                    type: 'constant',
                    parameters: ['number'],
                    description: 'Rounds `number` down.',
                    exampleCode: '{rounddown;1.23}',
                    exampleOut: '1',
                    execute: (_, [number]) => this.roundDown(number.value)
                }
            ]
        });
    }

    public roundDown(value: string): number {
        const number = parse.float(value);
        if (isNaN(number))
            throw new NotANumberError(value);
        return Math.floor(number);
    }
}
