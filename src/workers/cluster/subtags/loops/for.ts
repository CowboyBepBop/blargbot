import { BaseSubtag, BBTagContext, BBTagRuntimeError, NotANumberError } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { CompareOperator } from '@cluster/utils/bbtag/operators';

export class ForSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'for',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'initial', 'comparison', 'limit', 'increment?:1', '~code'],
                    description: 'To start, `variable` is set to `initial`. Then, the tag will loop, first checking `variable` against `limit` using `comparison`. ' +
                        'If the check succeeds, `code` will be run before `variable` being incremented by `increment` and the cycle repeating.\n' +
                        'This is very useful for repeating an action (or similar action) a set number of times. Edits to `variable` inside `code` will be ignored',
                    exampleCode: '{for;~index;0;<;10;{get;~index},}',
                    exampleOut: '0,1,2,3,4,5,6,7,8,9,',
                    execute: (ctx, [varName, initial, comparison, limit, increment, code]) => this.for(ctx, varName.value, initial.value, comparison.value, limit.value, increment.value, code)
                }
            ]
        });
    }

    public async * for(context: BBTagContext, varName: string, initialStr: string, operator: string, limitStr: string, incrementStr: string, code: SubtagArgumentValue): AsyncGenerator<string> {
        const errors = [];
        const initial = parse.float(initialStr);
        if (isNaN(initial))
            errors.push('Initial must be a number');

        if (!bbtagUtil.operators.isCompareOperator(operator))
            errors.push('Invalid operator');

        const limit = parse.float(limitStr);
        if (isNaN(limit))
            errors.push('Limit must be a number');

        const increment = parse.float(incrementStr);
        if (isNaN(increment))
            errors.push('Increment must be a number');

        if (errors.length > 0)
            throw new BBTagRuntimeError(errors.join(', '));

        limitStr = limit.toString();
        const test = (i: number): boolean => bbtagUtil.operators.compare[operator as CompareOperator](i.toString(), limitStr);

        for (let i = initial; test(i); i += increment) {
            await context.limit.check(context, 'for:loops');
            await context.variables.set(varName, i);
            yield await code.execute();
            const updatedVar = await context.variables.get(varName);
            switch (typeof updatedVar) {
                case 'string':
                    i = parse.float(updatedVar);
                    break;
                case 'number':
                    i = updatedVar;
                    break;
                default:
                    i = NaN;
                    break;
            }

            if (isNaN(i))
                throw new NotANumberError(updatedVar);
        }

        await context.variables.reset(varName);
    }
}
