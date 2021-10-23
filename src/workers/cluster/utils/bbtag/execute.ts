import { BBTagContext } from '@cluster/bbtag';
import { BBTagExecutionPlan, RuntimeReturnState } from '@cluster/types';
import { AsyncIterTools } from '@core/utils/asyncIterTools';
import { IterTools } from '@core/utils/iterTools';

import { resolveResult } from './resolveResult';

export async function execute(context: BBTagContext, executionPlan: BBTagExecutionPlan): Promise<string> {
    return await AsyncIterTools.from(executionPlan)
        .takeWhile(() => context.state.return === RuntimeReturnState.NONE)
        .flatMap(async step => {
            if (typeof step === 'string')
                return IterTools.yield(step);
            return resolveResult(await step.execute())
                .takeWhile(() => context.state.return === RuntimeReturnState.NONE);
        }).join('');
}
