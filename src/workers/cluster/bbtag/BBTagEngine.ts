import { Cluster } from '@cluster';
import { BBTagASTCall, BBTagCompileResult, BBTagContextOptions, BBTagExecutionResult, SerializedBBTagContext } from '@cluster/types';

import { BBTagCompiler } from './BBTagCompiler';
import { BBTagContext } from './BBTagContext';

export class BBTagEngine {
    private readonly compiler: BBTagCompiler;

    public constructor(public readonly cluster: Cluster) {
        this.compiler = new BBTagCompiler();
    }

    public async execute(code: string, context: SerializedBBTagContext | BBTagContextOptions, caller?: BBTagASTCall): Promise<BBTagExecutionResult> {
        const compiled = await this.compile(code, context);
        return await compiled.execute(caller);
    }

    public async compile(code: string, context: SerializedBBTagContext | BBTagContextOptions): Promise<BBTagCompileResult> {
        return this.compiler.compile(code, await this.resolveContext(context));
    }

    private async resolveContext(context: SerializedBBTagContext | BBTagContextOptions): Promise<BBTagContext> {
        if (context instanceof BBTagContext)
            return context;

        if ('message' in context)
            return new BBTagContext(this.cluster, context);

        return await BBTagContext.deserialize(this.cluster, context);

    }
}
