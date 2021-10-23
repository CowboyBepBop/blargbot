import { BaseSubtag, BBTagContext, BBTagRuntimeError, NotANumberError, NotEnoughArgumentsError } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

function parameters(this: BaseSubtag, args: string[], start?: string, end?: string): string {
    if (start === undefined) {
        return args.join(' ');
    }
    let from = parse.int(start);
    if (isNaN(from))
        throw new NotANumberError(start);

    if (end === undefined)
        return args[from];

    let to = end.toLowerCase() === 'n'
        ? args.length
        : parse.int(end);

    if (isNaN(to))
        throw new NotANumberError(end);

    // TODO This behaviour should be documented
    if (from > to)
        from = [to, to = from][0];

    if (to > args.length || from < 0)
        throw new NotEnoughArgumentsError(to, args.length);
    return args.slice(from, to).join(' ');
}
export class FunctionSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'function',
            category: SubtagType.COMPLEX,
            aliases: ['func'],
            definition: [
                {
                    parameters: ['name', '~code'],
                    description: 'Defines a function called `name`. Functions are called in the same way as subtags, however they are prefixed with `func.`. ' +
                        'While inside the `code` block of a function, you may use the `params`, `paramsarray` and `paramslength` subtags to access the values ' +
                        'passed to the function. These function identically to their `args` counterparts. ' +
                        '\n\nPlease note that there is a recursion limit of 200 which is also shared by `{exec}`, `{execcc}` and `{inject}`.',
                    exampleCode: '{function;test;{paramsarray}} {func.test;1;2;3;4}',
                    exampleOut: '["1","2","3","4"]',
                    execute: (ctx, [name, code]) => this.createFunction(ctx, name.value, code)
                }
            ]
        });
    }

    public createFunction(
        context: BBTagContext,
        funcName: string,
        code: SubtagArgumentValue
    ): undefined {
        let name = funcName.toLowerCase();

        if (name === '')
            throw new BBTagRuntimeError('Must provide a name');
        if (!name.startsWith('func.'))
            name = 'func.' + name;

        context.subtags.set(name, {
            compile: (_, __, funcAst) => {
                return async () => {
                    if (context.state.stackSize >= 200) {
                        context.state.return = -1;
                        throw new BBTagRuntimeError('Terminated recursive tag after ' + context.state.stackSize.toString() + ' execs.');
                    }
                    const args = await Promise.all(funcAst.args.map(arg => context.eval(bbtagUtil.buildExecutionPlan(context, arg))));
                    const overrides = [
                        context.subtags.set('params', {
                            compile: (_, __, paramsAst) => async () => {
                                const [start, end] = await Promise.all(paramsAst.args.map(arg => context.eval(bbtagUtil.buildExecutionPlan(context, arg))));
                                return parameters.call(this, args, start, end);
                            }
                        }),
                        context.subtags.set('paramsarray', {
                            compile: () => args
                        }),
                        context.subtags.set('paramslength', {
                            compile: () => args.length
                        })
                    ];
                    context.state.stackSize++;
                    try {
                        return await code.execute();
                    } finally {
                        context.state.stackSize--;
                        overrides.forEach(override => override.reset());
                    }
                };
            }
        });
        return undefined;
    }
}
