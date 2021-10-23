import { SubtagArgumentValue, SubtagCompiler, SubtagHandlerCallSignature, SubtagParameter, SubtagParameterGroup } from '@cluster/types';
import { bbtagUtil } from '@cluster/utils';
import { IterTools } from '@core/utils/iterTools';

import { ExecutingSubtagArgumentValue, LiteralSubtagArgumentValue } from '../arguments';
import { NotEnoughArgumentsError, TooManyArgumentsError } from '../errors';
import { createErrorCompiler } from './createErrorCompiler';

type SubtagCompilerFactory = (argCount: number) => SubtagCompiler | undefined;

export function createCompiler(signatures: Iterable<SubtagHandlerCallSignature>): SubtagCompiler {
    const handlerFactories: SubtagCompilerFactory[] = [];
    let maxArgs = 0;
    let minArgs = Infinity;
    for (const signature of signatures) {
        handlerFactories.push(...createCompilerFactories(signature));
        maxArgs = Math.max(maxArgs, signature.parameters.reduce((acc, p) => acc + p.maxCount * p.values.length, 0));
        minArgs = Math.min(minArgs, signature.parameters.reduce((acc, p) => acc + p.minCount * p.values.length, 0));
    }

    const lengthLookup: Record<number, SubtagCompiler | undefined> = {};
    return {
        compile(context, name, ast) {
            const compiler = lengthLookup[ast.args.length] ??= findCompiler(handlerFactories, ast.args.length) ?? createOutOfRangeCompiler(ast.args.length, minArgs, maxArgs);
            return compiler.compile(context, name, ast);
        }
    };
}

function findCompiler(factories: readonly SubtagCompilerFactory[], argLength: number): SubtagCompiler | undefined {
    let result;
    for (const factory of factories) {
        const handler = factory(argLength);
        if (handler !== undefined) {
            if (result !== undefined)
                throw new Error(`Duplicate handler found for ${argLength} arg(s)`);
            result = handler;
        }
    }
    return result;
}

function* createCompilerFactories(signature: SubtagHandlerCallSignature): Generator<SubtagCompilerFactory> {
    const binder = createBinder(signature.parameters);
    yield argCount => {
        const permutation = binder(argCount);
        if (permutation === undefined)
            return undefined;
        return createPermutationBinder(signature, permutation);
    };
}

function createPermutationBinder(signature: SubtagHandlerCallSignature, permutation: readonly SubtagParameter[]): SubtagCompiler {
    const indexMap = permutation.map((p, i) => ({ p, i }));
    const parameterOrder: Array<{ p: SubtagParameter; i?: number; }> = [];
    let i = 0;
    for (const parameter of signature.parameters) {
        let count = 0;
        while (count < parameter.minCount || indexMap[i]?.p === parameter.values[0]) {
            for (const value of parameter.values) {
                if (indexMap[i]?.p !== value)
                    parameterOrder.push({ p: value });
                else
                    parameterOrder.push(indexMap[i++]);
            }
            count++;
        }
    }

    return {
        compile(context, name, ast) {
            const deferred: Array<() => SubtagArgumentValue> = [];
            const allArgs: Array<() => Awaitable<SubtagArgumentValue>> = [];
            const constant: LiteralSubtagArgumentValue[] = [];

            constant.push = (...values) => {
                deferred.push(...values.map(v => () => v));
                return Array.prototype.push.call(constant, ...values);
            };
            deferred.push = (...values) => {
                allArgs.push(...values);
                return Array.prototype.push.call(deferred, ...values);
            };

            for (const { p, i } of parameterOrder) {
                if (i === undefined) {
                    constant.push(new LiteralSubtagArgumentValue(p.defaultValue));
                } else {
                    const plan = bbtagUtil.buildExecutionPlan(context, ast.args[i]);
                    if (plan.every(p => typeof p === 'string'))
                        constant.push(new LiteralSubtagArgumentValue(plan.join('')));
                    else if (!p.autoResolve)
                        deferred.push(() => new ExecutingSubtagArgumentValue(context, name, ast, plan, p.defaultValue, p.maxLength));
                    else
                        allArgs.push(async () => {
                            const arg = new ExecutingSubtagArgumentValue(context, name, ast, plan, p.defaultValue, p.maxLength);
                            await arg.execute();
                            return arg;
                        });

                }
            }

            if (signature.type === 'constant') {
                try {
                    if (constant.length === allArgs.length)
                        return signature.execute(context, Object.assign(constant, { subtagName: name }), ast);
                    else if (deferred.length === allArgs.length) {
                        const argValues = IterTools.from(deferred).map(p => p()).toArray();
                        return signature.execute(context, Object.assign(argValues, { subtagName: name }), ast);
                    }
                } catch (error: unknown) {
                    return () => {
                        throw error;
                    };
                }
            }

            return async () => {
                const argValues = await IterTools.from(allArgs).async.map(p => p()).toArray();
                return await signature.execute(context, Object.assign(argValues, { subtagName: name }), ast);
            };
        }
    };
}

function createBinder(parameters: readonly SubtagParameterGroup[]): (argCount: number) => readonly SubtagParameter[] | undefined {
    function createBinder(index: number): (argCount: number) => IterTools<SubtagParameter[]> {
        if (index === parameters.length)
            return argCount => argCount <= 0 ? IterTools.yield<SubtagParameter[]>([]) : IterTools.empty();
        const parameter = parameters[index];
        const next = createBinder(index + 1);
        const minYield = IterTools.from(parameter.values)
            .repeat(parameter.minCount)
            .toArray();

        return function bindGroup(argCount) {
            const toYield = [...minYield];
            return IterTools.range(parameter.minCount, parameter.maxCount + 1)
                .takeWhile(() => argCount >= toYield.length)
                .flatMap(function* () {
                    for (const permutation of next(argCount - toYield.length))
                        yield [...toYield, ...permutation];
                    toYield.push(...parameter.values);
                });
        };
    }

    const rootBinder = createBinder(0);
    return argCount => rootBinder(argCount).single(undefined, () => undefined);
}

function createOutOfRangeCompiler(argCount: number, minArgs: number, maxArgs: number): SubtagCompiler {
    if (argCount < minArgs)
        return createErrorCompiler(() => new NotEnoughArgumentsError(minArgs, argCount));
    if (argCount > maxArgs)
        return createErrorCompiler(() => new TooManyArgumentsError(maxArgs, argCount));
    throw new Error(`Missing definition for ${argCount} argument(s)`);
}
