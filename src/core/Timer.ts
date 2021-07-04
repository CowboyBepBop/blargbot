import moment, { Duration } from 'moment';

export class Timer {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #elapsed: number;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #start: number | undefined;

    public constructor() {
        this.#elapsed = 0;
    }

    public get running(): boolean { return this.#start !== undefined; }

    public get elapsed(): number {
        if (this.#start === undefined)
            return this.#elapsed;
        return this.#elapsed + (Date.now() - this.#start);
    }

    public get duration(): Duration {
        return moment.duration(this.elapsed, 'milliseconds');
    }

    public format(): string {
        const diff = this.duration;
        return `${diff.minutes()} minutes, ${diff.seconds()} seconds, and ${diff.milliseconds()} milliseconds`;
    }

    public start(reset = true): this {
        if (this.#start !== undefined)
            throw new Error('Cannot start an already started timer');
        if (reset)
            this.#elapsed = 0;
        this.#start = Date.now();
        return this;
    }

    public poll(reset = false): number {
        const elapsed = this.elapsed;
        if (reset) {
            this.end();
            this.start();
        }
        return elapsed;
    }

    public resume(): this {
        return this.start(false);
    }

    public end(): this {
        if (this.#start !== undefined) {
            this.#elapsed += Date.now() - this.#start;
            this.#start = undefined;
        }
        return this;
    }
}
