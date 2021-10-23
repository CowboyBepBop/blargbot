import { BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { RuntimeLimitRule } from '@cluster/types';

interface UseCountOptions {
    readonly display: (usageCount: number) => string;
    readonly error: (usageCount: number, subtagName: string) => BBTagRuntimeError | string;
}
const defaultUseCountOptions: UseCountOptions = {
    display: n => `Maximum ${n} uses`,
    error: (_, n) => `Usage limit reached for {${n}}`
};

export class UseCountRule implements RuntimeLimitRule {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #initial: number;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #options: UseCountOptions;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #remaining: number;

    public constructor(count: number, options: UseCountOptions = defaultUseCountOptions) {
        this.#initial = count;
        this.#remaining = count;
        this.#options = options;
    }

    public install(context: BBTagContext, subtagName: string): void {
        const current = context.subtags.get(subtagName);
        if (current === undefined)
            return;

        context.subtags.set(subtagName, {
            compile: (context, ...rest) => {
                const core = current.compile(context, ...rest);
                if (typeof core === 'function') {
                    return () => {
                        this.check(context, subtagName);
                        return core();
                    };
                }
                return () => {
                    this.check(context, subtagName);
                    return core;
                };
            }
        });
    }

    public check(_context: BBTagContext, subtagName: string): void {
        if (this.#remaining-- <= 0) {
            let err = this.#options.error(this.#initial, subtagName);
            if (typeof err === 'string')
                err = new BBTagRuntimeError(err);
            throw err;
        }
    }

    public displayText(): string {
        return this.#options.display(this.#initial);
    }

    public state(): number {
        return this.#remaining;
    }

    public load(state: JToken): void {
        if (typeof state !== 'number')
            throw new Error(`Invalid state ${JSON.stringify(state)}`);

        this.#remaining = state;
    }
}
