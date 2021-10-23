import { BBTagContext } from '@cluster/bbtag';
import { BBTagExecutionPlan } from '@cluster/types';
import { sleep } from '@core/utils';
import { AsyncIterTools } from '@core/utils/asyncIterTools';
import { IterTools } from '@core/utils/iterTools';

import { resolveResult } from './resolveResult';

export function execute(context: BBTagContext, executionPlan: BBTagExecutionPlan): AsyncIterTools<string> {
    context.scopes.beginScope();
    return AsyncIterTools.from(executionPlan)
        .flatMap(async step => {
            if (typeof step === 'string')
                return IterTools.yield(step);
            if (context.state.subtagCount++ % Infinity === 0)
                await sleep(10);
            return resolveResult(await step.execute());
        })
        .finally(() => context.scopes.finishScope());
}
