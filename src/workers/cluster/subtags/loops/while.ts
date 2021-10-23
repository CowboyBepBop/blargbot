import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class WhileSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'while',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['~boolean', '~code'],
                    description: 'This will continuously execute `code` for as long as `boolean` returns `true`.',
                    exampleCode: '{set;~x;0}\n{set;~end;false}\n{while;{get;~end};\n\t{if;{increment;~x};==;10;\n\t\t{set;~end;true}\n\t}\n}\n{get;~end}',
                    exampleOut: '10',
                    execute: (ctx, args) => this.executeWhile(ctx, args[0], '==', 'true', args[1])
                },
                {
                    parameters: ['~value1', '~evaluator', '~value2', '~code'],
                    description: 'This will continuously execute `code` for as long as the condition returns `true`. The condition is as follows:\n' +
                        'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
                        'Valid evaluators are `' + Object.keys(bbtagUtil.operators.compare).join('`, `') + '`.',
                    exampleCode: '{set;~x;0}\n{while;{get;~x};<=;10;{increment;~x},}.',
                    exampleOut: '1,2,3,4,5,6,7,8,9,10,11,',
                    execute: (ctx, args) => this.executeWhile(ctx, args[0], args[1], args[2], args[3])
                }
            ]
        });
    }

    public async * executeWhile(
        context: BBTagContext,
        left: SubtagArgumentValue,
        operator: SubtagArgumentValue | string,
        right: SubtagArgumentValue | string,
        codeRaw: SubtagArgumentValue
    ): AsyncGenerator<string> {
        const getLeft = (): Promise<string> => left.execute();
        const getOperator = typeof operator === 'string' ? () => operator : () => operator.execute();
        const getRight = typeof right === 'string' ? () => right : () => right.execute();

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            await context.limit.check(context, 'while:loops');
            const left = await getLeft();
            const operator = await getOperator();
            const right = await getRight();

            if (!callOperator(operator, left, right))
                break;

            yield await codeRaw.execute();
        }
    }
}

function callOperator(val1: string, val2: string, val3: string): boolean {
    if (bbtagUtil.operators.isCompareOperator(val1))
        return bbtagUtil.operators.compare[val1](val2, val3);
    if (bbtagUtil.operators.isCompareOperator(val2))
        return bbtagUtil.operators.compare[val2](val1, val3);
    if (bbtagUtil.operators.isCompareOperator(val3))
        return bbtagUtil.operators.compare[val3](val1, val2);
    //TODO invalid operator stuff here
    return false;
}
