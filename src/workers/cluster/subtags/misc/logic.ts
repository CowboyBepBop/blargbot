import { BaseSubtag, BBTagRuntimeError, NotABooleanError } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.logic;

export class LogicSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'logic',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['operator', 'values+'],
                    description: 'Accepts 1 or more boolean `values` (`true` or `false`) and returns the result of `operator` on them. ' +
                        'Valid logic operators are `' + Object.keys(operators).join('`, `') + '`.' +
                        'See `{operators}` for a shorter way of performing logic operations.',
                    exampleCode: '{logic;&&;true;false}',
                    exampleOut: 'false',
                    execute: (_, args) => this.applyLogicOperation(args.map(arg => arg.value))
                }
            ]
        });
    }

    public applyLogicOperation(args: string[]): string {
        let operator;

        for (let i = 0; i < args.length; i++) {
            const operatorName = args[i].toLowerCase();
            if (bbtagUtil.operators.isLogicOperator(operatorName)) {
                operator = operatorName;
                args.splice(i, 1);
            }
        }

        if (operator === undefined)
            throw new BBTagRuntimeError('Invalid operator');

        const values = args;
        if (operator === '!') {
            const value = parse.boolean(values[0]);
            if (typeof value !== 'boolean')
                throw new NotABooleanError(values[0]);
            return operators[operator]([value]).toString();
        }
        const parsedValues = values.map((value) => {
            const result = parse.boolean(value);
            if (result !== undefined)
                return result;
            throw new NotABooleanError(value);
        });
        return operators[operator](parsedValues).toString();
    }
}
