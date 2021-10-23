import { BBTagRuntimeError } from '@cluster/bbtag';
import { RuntimeLimitRule } from '@cluster/types';

import { BBTagContext } from '../../BBTagContext';

export class StaffOnlyRule implements RuntimeLimitRule {
    public static readonly instance: StaffOnlyRule = new StaffOnlyRule();

    public install(context: BBTagContext, subtagName: string): void {
        const current = context.subtags.get(subtagName);
        if (current === undefined)
            return;

        context.subtags.set(subtagName, {
            compile: (context, ...rest) => {
                const core = current.compile(context, ...rest);
                if (typeof core === 'function')
                    return () => this.check(context).then(core);
                return () => this.check(context).then(() => core);
            }
        });
    }

    public async check(context: BBTagContext): Promise<void> {
        if (!await context.isStaff)
            throw new BBTagRuntimeError('Authorizer must be staff');
    }

    public displayText(): string {
        return 'Authorizer must be staff';
    }

    public state(): JToken {
        return null;
    }

    public load(): void {
        // NOOP
    }
}
