import { PromiseCompletionSource } from '@core/PromiseCompletionSource';

export class Awaiter<T> implements PromiseLike<T | undefined> {
    private readonly timeout: NodeJS.Timeout;
    private readonly pcs: PromiseCompletionSource<T | undefined>;

    public constructor(
        private readonly poolIds: ReadonlySet<string>,
        private readonly pools: Record<string, Array<Awaiter<T>> | undefined>,
        private readonly check: (item: T) => Awaitable<boolean>,
        timeout: number
    ) {
        this.pcs = new PromiseCompletionSource<T | undefined>();

        for (const poolId of poolIds)
            (pools[poolId] ??= []).push(this);

        this.timeout = setTimeout(() => this.cancel(), timeout);
    }

    public then<TResult1 = T | undefined, TResult2 = never>(
        onfulfilled?: ((value: T | undefined) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2> {
        return this.pcs.promise.then(onfulfilled, onrejected);
    }

    public async tryConsume(item: T): Promise<boolean> {
        if (!await this.check(item))
            return false;
        this.pcs.resolve(item);
        this.cleanup();
        return true;
    }

    public cancel(): void {
        this.pcs.resolve(undefined);
        this.cleanup();
    }

    private cleanup(): void {
        clearTimeout(this.timeout);
        for (const poolId of this.poolIds) {
            const pool = this.pools[poolId];
            if (pool !== undefined) {
                pool.splice(pool.indexOf(this), 1);
                if (pool.length === 0)
                    delete this.pools[poolId];
            }
        }
    }
}
