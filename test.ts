import 'module-alias/register';

import { ClusterWorker } from '@cluster';
import { BBTagContext } from '@cluster/bbtag';
import { GetSubtag } from '@cluster/subtags/bot/get';
import { BBTagASTCall } from '@cluster/types';
import { bbtagUtil } from '@cluster/utils';
import { createLogger } from '@core/Logger';
import { Timer } from '@core/Timer';

void (async function test() {
    process.env.CLUSTER_ID = '0';
    process.env.SHARDS_MAX = '1';
    process.env.SHARDS_FIRST = '0';
    process.env.SHARDS_LAST = '0';
    const { default: config } = await import('@config');
    const logger = createLogger(config, 'TEST');
    const worker = new ClusterWorker(process, logger, config);
    const context = new BBTagContext(worker.cluster, ({
        inputRaw: ''
    } as unknown as undefined)!);
    const subtag = bbtagUtil.parse('{get;~abc}', context)[0] as BBTagASTCall;
    const impl = new GetSubtag().compile(context, 'get', subtag);
    if (typeof impl !== 'function')
        throw new Error('Cant perf test a constant subtag');
    const timer = new Timer().start();
    console.info('Running 1m get subtags');
    for (let i = 0; i < 1000000; i++)
        await impl();
    console.info(timer.elapsed);
}());
