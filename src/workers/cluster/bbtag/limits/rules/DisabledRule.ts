import { BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { createErrorCompiler } from '@cluster/bbtag/compilation';
import { RuntimeLimitRule } from '@cluster/types';

export class DisabledRule implements RuntimeLimitRule {
    public static readonly instance: DisabledRule = new DisabledRule();

    public install(context: BBTagContext, subtagName: string): void {
        if (context.subtags.get(subtagName) !== undefined)
            context.subtags.set(subtagName, createErrorCompiler((ctx, name) => this.check(ctx, name)));
    }

    public check(context: BBTagContext, subtagName: string): never {
        throw new BBTagRuntimeError(`{${subtagName}} is disabled in ${context.limit.scopeName}`);
    }

    public displayText(subtagName: string): string {
        return `{${subtagName}} is disabled`;
    }

    public state(): JToken {
        return null;
    }

    public load(): void {
        // NOOP
    }
}
