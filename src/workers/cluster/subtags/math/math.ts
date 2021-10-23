import { BaseSubtag, BBTagRuntimeError, NotANumberError } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.numeric;

export class MathSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'math',
            category: SubtagType.MATH,
            definition: [
                {
                    type: 'constant',
                    parameters: ['numbers+'],
                    description: 'Accepts multiple `values` and returns the result of `operator` on them. ' +
                        'Valid operators are `' + Object.keys(operators).join('`, `') + '`\n' +
                        'See `{operators}` for a shorter way of performing numeric operations.',
                    exampleCode: '2 + 3 + 6 - 2 = {math;-;{math;+;2;3;6};2}',
                    exampleOut: '2 + 3 + 6 - 2 = 9',
                    execute: (_, [operator, ...numbers]) => this.doMath(operator.value, numbers.map(arg => arg.value))
                }
            ]
        });
    }

    public doMath(
        operator: string,
        args: string[]
    ): string {
        if (!bbtagUtil.operators.isNumericOperator(operator))
            throw new BBTagRuntimeError('Invalid operator', operator + ' is not an operator');

        const values = bbtagUtil.tagArray.flattenArray(args);
        const parsedValues = values.map(value => {
            switch (typeof value) {
                case 'number':
                    return value;
                case 'string': {
                    const result = parse.float(value, false);
                    if (result !== undefined)
                        return result;
                }
            }
            throw new NotANumberError(value);
        });

        return parsedValues.reduce(operators[operator]).toString();
    }
}
