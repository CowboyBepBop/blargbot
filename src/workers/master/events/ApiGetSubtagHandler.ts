import { ApiConnection } from '@api';
import { WorkerPoolEventService } from '@core/serviceTypes';
import { WorkerPoolEventHandler } from '@core/types';
import { Master } from '@master';

export class ApiGetSubtagHandler extends WorkerPoolEventService<ApiConnection> {
    private nextCluster: number;

    public constructor(private readonly master: Master) {
        super(master.api, 'getSubtag');
        this.nextCluster = 0;
    }

    protected async execute(...args: Parameters<WorkerPoolEventHandler<ApiConnection>>): Promise<void> {
        const cluster = this.master.clusters.tryGet(this.nextCluster);
        if (cluster === undefined) {
            if (this.nextCluster === 0)
                throw new Error('No clusters are available');
            this.nextCluster = 0;
            return await this.execute(...args);
        }
        this.nextCluster++;

        const result = await cluster.request('getSubtag', args[1]);
        args[3](result);
    }
}
