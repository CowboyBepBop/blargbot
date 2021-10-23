import { BaseSubtag, BBTagRuntimeError } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.compare;

export class BoolSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'bool',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['arg1', 'evaluator', 'arg2'],
                    description:
                        'Evaluates `arg1` and `arg2` using the `evaluator` and returns `true` or `false`. ' +
                        'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`\n' +
                        'The positions of `evaluator` and `arg1` can be swapped.',
                    exampleCode: '{bool;5;<=;10}',
                    exampleOut: 'true',
                    execute: (_, [left, evaluator, right]) => this.runCondition(left.value, evaluator.value, right.value)
                }
            ]
        });
    }

    public runCondition(leftStr: string, evaluator: string, rightStr: string): boolean {
        let operator;
        if (bbtagUtil.operators.isCompareOperator(evaluator)) {
            operator = evaluator;
        } else if (bbtagUtil.operators.isCompareOperator(leftStr)) {
            operator = leftStr;
            [leftStr, operator] = [operator, leftStr];
        } else if (bbtagUtil.operators.isCompareOperator(rightStr)) {
            operator = rightStr;
            [operator, rightStr] = [rightStr, operator];
        } else
            throw new BBTagRuntimeError('Invalid operator');

        leftStr = parse.boolean(leftStr, undefined, false)?.toString() ?? leftStr;
        rightStr = parse.boolean(rightStr, undefined, false)?.toString() ?? rightStr;

        return operators[operator](leftStr, rightStr);
    }
}
