import { Cluster } from '../cluster';
import { codeBlock, commandTypes } from '../utils';
import { BaseCommand } from '../core/command';

export class EvalCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'eval',
            category: commandTypes.CAT,
            definition: {
                parameters: '{code+}',
                execute: (ctx) => this.eval(ctx.author.id, ctx.argsString),
                description: 'Runs the code you enter on the current cluster'
            }
        });
    }

    public async eval(userId: string, code: string): Promise<string> {
        [, code] = /^```(?:\w*?\s*\n|)(.*)\n```$/s.exec(code) ?? [, code];

        const { success, result } = await this.cluster.eval(userId, code);
        return success
            ? `Input:${codeBlock(code, 'js')}Output:${codeBlock(result, 'json')}`
            : `An error occured!${codeBlock(result, 'json')}`;
    }
}