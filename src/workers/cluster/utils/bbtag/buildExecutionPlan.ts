import { BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { BBTagAST, BBTagASTCall, BBTagExecutionPlan, BBTagInvocation, CompiledSubtag, SubtagResult } from '@cluster/types';
import { discordUtil, parse, snowflake } from '@core/utils';
import { IterTools } from '@core/utils/iterTools';
import { inspect } from 'util';

import { execute } from './execute';
import { resolveResult } from './resolveResult';
import { stringifyRange } from './stringifyRange';

export function buildExecutionPlan(context: BBTagContext, ast: BBTagAST): BBTagExecutionPlan {
    return IterTools.from(ast)
        .flatMap<BBTagExecutionPlan[number]>(item => {
            if (typeof item === 'string')
                return IterTools.yield(item);

            const namePlan = buildExecutionPlan(context, item.name);
            if (namePlan.length !== 1 || typeof namePlan[0] !== 'string')
                return IterTools.yield(createDynamicInvocation(context, namePlan, item));

            const name = namePlan[0];
            const compiler = context.subtags.get(name.toLowerCase());
            if (compiler === undefined)
                return IterTools.yield(createUnknownInvocation(context, name, item));

            const compiled = compiler.compile(context, name, item);
            if (typeof compiled !== 'function')
                return resolveResult(compiled);

            return IterTools.yield(createCompiledInvocation(context, compiled, name, item));
        })
        .reduce<Array<BBTagExecutionPlan[number]>>((acc, i) => {
            if (typeof i === 'string' && typeof acc[acc.length - 1] === 'string')
                acc[acc.length - 1] += i;
            else
                acc.push(i);
            return acc;
        }, []);
}

function createDynamicInvocation(context: BBTagContext, namePlan: BBTagExecutionPlan, ast: BBTagASTCall): BBTagInvocation {
    context.warnings.push({
        subtag: ast,
        message: 'Dynamic subtag found. This may error at runtime'
    });
    return {
        ...ast,
        execute() {
            return dynamicInvoke(context, namePlan, ast);
        }
    };
}

async function dynamicInvoke(context: BBTagContext, namePlan: BBTagExecutionPlan, ast: BBTagASTCall): Promise<SubtagResult> {
    const name = await execute(context, namePlan).join('');
    return await compileAndInvoke(context, name, ast);
}

function createUnknownInvocation(context: BBTagContext, name: string, ast: BBTagASTCall): BBTagInvocation {
    context.errors.push({
        subtag: ast,
        message: `Unknown subtag {${name}}`
    });
    return {
        ...ast,
        execute() {
            return compileAndInvoke(context, name, ast);
        }
    };
}

async function compileAndInvoke(context: BBTagContext, alias: string, ast: BBTagASTCall): Promise<SubtagResult> {
    const compiler = context.subtags.get(alias.toLowerCase());
    if (compiler === undefined)
        return context.addError(`Unknown subtag ${alias}`, ast);

    const compiled = compiler.compile(context, alias, ast);
    if (typeof compiled !== 'function')
        return compiled;

    return await invoke(context, compiled, alias, ast);
}

function createCompiledInvocation(context: BBTagContext, handler: CompiledSubtag, alias: string, ast: BBTagASTCall): BBTagInvocation {
    return {
        ...ast,
        execute() {
            return invoke(context, handler, alias, ast);
        }
    };
}

async function invoke(context: BBTagContext, handler: CompiledSubtag, alias: string, ast: BBTagASTCall): Promise<SubtagResult> {
    try {
        return await handler();
    } catch (error: unknown) {
        if (error instanceof BBTagRuntimeError)
            return emitError(context, error, ast);

        const errorId = snowflake.create().toString();
        context.logger.error(errorId, error);
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        let description = `${error}`;
        if (description.length > discordUtil.getLimit('embed.description'))
            description = description.substring(0, discordUtil.getLimit('embed.description') - 15) + '... (truncated)';

        await context.util.send(context.util.config.discord.channels.errorlog, {
            embeds: [
                {
                    title: 'A tag error occurred',
                    description: description,
                    color: parse.color('red'),
                    fields: [
                        { name: 'SubTag', value: alias, inline: true },
                        { name: 'Arguments', value: ast.source.length > 100 ? ast.source.slice(0, 97) + '...' : ast.source },
                        { name: 'Tag Name', value: context.rootTagName, inline: true },
                        { name: 'Location', value: `${stringifyRange(ast)}`, inline: true },
                        { name: 'Channel | Guild', value: `${context.channel.id} | ${context.guild.id}`, inline: true },
                        { name: 'CCommand', value: context.isCC ? 'Yes' : 'No', inline: true }
                    ]
                }
            ],
            files: [
                {
                    attachment: inspect(error),
                    name: 'error.txt'
                }
            ]
        });
        return context.addError('An internal server error has occurred', ast, `Error Id: ${errorId}`);
    }
}

function* emitError(context: BBTagContext, error: BBTagRuntimeError, ast: BBTagASTCall): Generator<string> {
    if (error.emit)
        yield context.addError(error.message, ast, error.detail);
    if (error.terminate !== undefined)
        throw error;
}
