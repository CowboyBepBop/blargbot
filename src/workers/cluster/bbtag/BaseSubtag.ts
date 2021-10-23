import { BBTagASTCall, SubtagCompiler, SubtagCompilerResult, SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagOptions } from '@cluster/types';
import { SubtagType } from '@cluster/utils';
import { MessageEmbedOptions } from 'discord.js';

import { BBTagContext } from './BBTagContext';
import { createCompiler, parseDefinitions } from './compilation';

export abstract class BaseSubtag implements SubtagOptions, SubtagCompiler {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: SubtagType;
    public readonly isTag: true;
    public readonly desc: string | undefined;
    public readonly deprecated: string | boolean;
    public readonly staff: boolean;
    public readonly signatures: readonly SubtagHandlerCallSignature[];
    public readonly compiler: SubtagCompiler;

    protected constructor(options: SubtagOptions & { definition: readonly SubtagHandlerDefinition[]; }) {
        this.name = options.name;
        this.aliases = options.aliases ?? [];
        this.category = options.category;
        this.isTag = true;
        this.desc = options.desc;
        this.deprecated = options.deprecated ?? false;
        this.staff = options.staff ?? false;
        this.signatures = parseDefinitions(options.definition);
        this.compiler = createCompiler(this.signatures);
    }

    public compile(context: BBTagContext, subtagName: string, subtag: BBTagASTCall): SubtagCompilerResult {
        return this.compiler.compile(context, subtagName, subtag);
    }

    public enrichDocs(docs: MessageEmbedOptions): MessageEmbedOptions {
        return docs;
    }

}
