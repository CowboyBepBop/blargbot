import { BaseSubtag, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class AbsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'abs',
            category: SubtagType.MATH,
            aliases: ['absolute'],
            definition: [
                {
                    type: 'constant',
                    parameters: ['number'],
                    description: 'Gets the absolute value of `number`',
                    exampleCode: '{abs;-535}',
                    exampleOut: '535',
                    execute: (_, [value]) => this.abs(value.value)
                },
                {
                    type: 'constant',
                    parameters: ['numbers+2'],
                    description: 'Gets the absolute value of each `numbers` and returns an array containing the results',
                    exampleCode: '{abs;-535;123;-42}',
                    exampleOut: '[535, 123, 42]',
                    execute: (_, args) => this.absAll(args.map(arg => arg.value))
                }
            ]
        });
    }

    public absAll(values: string[]): number[] {
        const result = [];
        for (const value of values) {
            const parsed = parse.float(value);
            if (isNaN(parsed))
                throw new NotANumberError(value);
            result.push(Math.abs(parsed));
        }
        return result;
    }

    public abs(value: string): number {
        const val = parse.float(value);
        if (isNaN(val))
            throw new NotANumberError(value);
        return Math.abs(val);
    }
}
