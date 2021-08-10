import { ExecutionResult } from '@cluster/types';
import { codeBlock, humanize } from '@core/utils';
import { FileOptions } from 'discord.js';
import moment from 'moment';

export function createDebugOutput(name: string, code: string, args: string, result: ExecutionResult): { content: string; files: FileOptions[]; } {
    const performance: Record<string, unknown> = {};
    for (const key of Object.keys(result.duration.subtag)) {
        const times = result.duration.subtag[key];
        if (times !== undefined && times.length > 0) {
            const totalTime = times.reduce((l, r) => l + r);
            performance[key] = {
                count: times.length,
                totalMs: totalTime,
                averageMs: totalTime / times.length,
                timesMs: times
            };
        }
    }

    return {
        content: codeBlock(
            `         Execution Time: ${humanize.duration(moment.duration(result.duration.active, 'ms'))}\n` +
            `    Variables Committed: ${result.database.committed}\n` +
            `Database Execution Time: ${humanize.duration(moment.duration(result.duration.database, 'ms'))}\n` +
            `   Total Execution Time: ${humanize.duration(moment.duration(result.duration.total, 'ms'))}`,
            'js'),
        files: [
            {
                name: 'bbtag.debug.json',
                attachment: JSON.stringify({
                    tagName: name,
                    userInput: args,
                    code: code,
                    debug: result.debug,
                    errors: result.errors,
                    variables: result.database.values,
                    performance: performance
                }, undefined, 2)
            }
        ]
    };
}
