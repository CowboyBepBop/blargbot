import { BaseSubtag, BBTagRuntimeError, NotABooleanError } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.compare;

export class IfSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'if',
            category: SubtagType.COMPLEX,
            desc:
                'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
                'If they are not provided, `value1` is read as `true` or `false`. ' +
                'If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\n' +
                'Valid evaluators are `' + Object.keys(operators).join('`, `') + '`.',
            definition: [
                {
                    parameters: ['boolean', '~then'],
                    description:
                        'If `boolean` is `true`, return `then`, else do nothing.',
                    execute: (_, [bool, thenCode]) => this.simpleBooleanCheck(bool.value, thenCode)
                },
                {
                    parameters: ['boolean', '~then', '~else'],
                    description:
                        'If `boolean` is `true`, return `then`, else execute `else`',
                    execute: (_, [bool, thenCode, elseCode]) => this.simpleBooleanCheck(bool.value, thenCode, elseCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then'],
                    description:
                        '`Value1` is evaluated against `value2` using `evaluator, if the resulting value is `true` then the tag returns `then`.',
                    execute: (_, [left, evaluator, right, thenCode]) => this.evaluatorCheck(left.value, evaluator.value, right.value, thenCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then', '~else'],
                    description:
                        '`Value1` is evaluated against `value2` using `evaluator, if the resulting value is `true` then the tag returns `then`, otherwise it returns `else`',
                    execute: (_, [left, evaluator, right, thenCode, elseCode]) => this.evaluatorCheck(left.value, evaluator.value, right.value, thenCode, elseCode)
                }
            ]
        });
    }
    public async simpleBooleanCheck(
        boolStr: string,
        thenCode: SubtagArgumentValue,
        elseCode?: SubtagArgumentValue
    ): Promise<string | undefined> {
        const bool = parse.boolean(boolStr);
        if (bool === undefined)
            throw new NotABooleanError(boolStr);

        if (bool)
            return await thenCode.wait();
        if (elseCode !== undefined)
            return await elseCode.wait();
        return undefined;
    }

    public async evaluatorCheck(
        leftStr: string,
        evaluator: string,
        rightStr: string,
        thenCode: SubtagArgumentValue,
        elseCode?: SubtagArgumentValue
    ): Promise<string | undefined> {
        let operator;
        if (bbtagUtil.operators.isCompareOperator(evaluator)) {
            operator = evaluator;
        } else if (bbtagUtil.operators.isCompareOperator(leftStr)) {
            operator = leftStr;
            [leftStr, evaluator] = [evaluator, leftStr];
        } else if (bbtagUtil.operators.isCompareOperator(rightStr)) {
            operator = rightStr;
            [evaluator, rightStr] = [rightStr, evaluator];
        } else
            throw new BBTagRuntimeError('Invalid operator');

        leftStr = parse.boolean(leftStr, undefined, false)?.toString() ?? leftStr;
        rightStr = parse.boolean(rightStr, undefined, false)?.toString() ?? rightStr;

        if (operators[operator](leftStr, rightStr))
            return await thenCode.wait();
        else if (elseCode !== undefined)
            return await elseCode.wait();
        return undefined;
    }
}
