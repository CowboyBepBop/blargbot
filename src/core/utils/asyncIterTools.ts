type Selector<Source, Result> = (value: Source, index: number) => Awaitable<Result>;
type GuardSelector<Source, Result extends Source> = (value: Source, index: number) => value is Result;

export class AsyncIterTools<T> implements AsyncIterable<T> {
    public static create<Item, Args extends unknown[], This>(generatorFn: (this: This, ...args: Args) => AsyncIterator<Item>, thisArg: This, args: Args): AsyncIterTools<Item> {
        return new AsyncIterTools({
            [Symbol.asyncIterator]() {
                return generatorFn.call(thisArg, ...args);
            }
        });
    }

    public static from<Item>(source: AsyncIterable<Item> | Iterable<Item>): AsyncIterTools<Item> {
        if (isIterator(source))
            return new AsyncIterTools(source).memoize();
        return new AsyncIterTools(source);
    }

    public static yield<Item>(...values: Item[]): AsyncIterTools<Item> {
        return new AsyncIterTools([...values]);
    }

    public static empty<T>(): AsyncIterTools<T> {
        return AsyncIterTools.yield();
    }

    public static isIterable<T>(value: unknown): value is AsyncIterable<T> {
        return typeof value === 'object'
            && value !== null
            && Symbol.asyncIterator in value
            && typeof (<AsyncIterable<T>>value)[Symbol.asyncIterator] === 'function';
    }

    private readonly source: AsyncIterable<T>;
    private constructor(source: AsyncIterable<T> | Iterable<T>) {
        this.source = toAsyncIterable(source);
    }

    public [Symbol.asyncIterator](): AsyncIterator<T> {
        return this.source[Symbol.asyncIterator]();
    }

    public memoize(): AsyncIterTools<T> {
        const cache: T[] = [];
        const iterator = this[Symbol.asyncIterator]();
        let done = false;
        return AsyncIterTools.create(async function* memoize() {
            yield* cache;
            while (!done) {
                const next = await iterator.next();
                if (next.done === true) {
                    done = true;
                    break;
                }
                cache.push(next.value);
                yield next.value;
            }
        }, undefined, []);
    }

    public async first(test?: Selector<T, boolean>, ifNoMatches?: () => T): Promise<T>;
    public async first<Result>(test?: Selector<T, boolean>, ifNoMatches?: () => T | Result): Promise<T | Result>;
    public async first<Result extends T>(test: GuardSelector<T, Result>, ifNoMatches?: () => Result): Promise<Result>;
    public async first(test?: Selector<T, boolean>, ifNoMatches?: () => T): Promise<T> {
        for await (const item of test === undefined ? this : this.filter(test))
            return item;
        if (ifNoMatches === undefined)
            throw new Error('Sequence contained no elements');
        return ifNoMatches();
    }

    public async single(test?: Selector<T, boolean>, ifNoMatches?: () => T): Promise<T>;
    public async single<Result>(test?: Selector<T, boolean>, ifNoMatches?: () => T | Result): Promise<T | Result>;
    public async single<Result extends T>(test: GuardSelector<T, Result>, ifNoMatches?: () => Result): Promise<Result>;
    public async single(test?: Selector<T, boolean>, ifNoMatches?: () => T): Promise<T> {
        let result: { value: T; } | undefined;
        for await (const item of test === undefined ? this : this.filter(test)) {
            if (result !== undefined)
                throw new Error('Sequence contained more than 1 element');
            result = { value: item };
        }
        if (result !== undefined)
            return result.value;
        if (ifNoMatches === undefined)
            throw new Error('Sequence contained no elements');
        return ifNoMatches();
    }

    public async last(test?: Selector<T, boolean>, ifNoMatches?: () => T): Promise<T>;
    public async last<Result>(test?: Selector<T, boolean>, ifNoMatches?: () => T | Result): Promise<T | Result>;
    public async last<Result extends T>(test: GuardSelector<T, Result>, ifNoMatches?: () => Result): Promise<Result>;
    public async last(test?: Selector<T, boolean>, ifNoMatches?: () => T): Promise<T> {
        const iterator = (test === undefined ? this : this.filter(test))[Symbol.asyncIterator]();
        let result = await iterator.next();
        while (result.done !== true) {
            const next = await iterator.next();
            if (next.done === true)
                break;
            result = next;
        }
        if (result.done !== true)
            return result.value;
        if (ifNoMatches === undefined)
            throw new Error('Sequence contained no elements');
        return ifNoMatches();
    }

    public async toArray(): Promise<T[]> {
        const result = [];
        for await (const item of this)
            result.push(item);
        return result;
    }

    public async toSet(): Promise<Set<T>> {
        const result = new Set<T>();
        for await (const item of this)
            result.add(item);
        return result;
    }

    public async contains(value: T): Promise<boolean> {
        return await this.containsFn(v => v === value);
    }

    public async containsFn(test: Selector<T, boolean>): Promise<boolean> {
        let i = 0;
        for await (const item of this)
            if (await test(item, i++))
                return true;
        return false;
    }

    public async count(test?: Selector<T, boolean>): Promise<number> {
        let count = 0;
        for await (const _ of test === undefined ? this : this.filter(test))
            count++;
        return count;
    }

    public async join(separator?: string): Promise<string> {
        const result = [];
        for await (const item of this)
            result.push(item);
        return result.join(separator);
    }

    public async reduce(reduceFn: (accumulator: T, item: T, index: number) => Awaitable<T>): Promise<T>;
    public async reduce<Result>(reduceFn: (accumulator: Result, item: T, index: number) => Awaitable<Result>, initial: Result): Promise<Result>;
    public async reduce(reduceFn: (accumulator: T, item: T, index: number) => Awaitable<T>, initial?: T): Promise<T> {
        let source = this as AsyncIterTools<T>;
        if (initial === undefined) {
            source = this.memoize();
            initial = await source.first();
            source = source.skip(1);
        }
        let i = 0;
        for await (const item of source)
            initial = await reduceFn(initial, item, i++);
        return initial;
    }

    public async toMap<Key, Value>(this: Iterable<[Key, Value]>): Promise<Map<Key, Value>>;
    public async toMap<Key>(keySelector: Selector<T, Key>): Promise<Map<Key, T>>;
    public async toMap<Key, Value>(keySelector: Selector<T, Key>, valueSelector: Selector<T, Value>): Promise<Map<Key, Value>>;
    public async toMap(keySelector?: Selector<T, unknown>, valueSelector?: Selector<T, unknown>): Promise<Map<unknown, unknown>> {
        if (keySelector === undefined) {
            keySelector = v => (<unknown[]><unknown>v)[0];
            valueSelector = v => (<unknown[]><unknown>v)[1];
        } else if (valueSelector === undefined) {
            valueSelector = v => v;
        }

        const result = new Map<unknown, unknown>();
        const keys = new Set<unknown>();
        let i = 0;
        for await (const item of this) {
            const key = await keySelector(item, i);
            if (keys.size === keys.add(key).size)
                throw new Error('Duplicate key found');
            const value = await valueSelector(item, i++);
            result.set(key, value);
        }
        return result;
    }

    public skip(count: number): AsyncIterTools<T> {
        return this.skipWhile((_, i) => i < count);
    }

    public skipWhile(test: Selector<T, boolean>): AsyncIterTools<T> {
        return AsyncIterTools.create(async function* skip(test: Selector<T, boolean>) {
            let i = 0;
            for await (const item of this) {
                if (await test(item, i++))
                    continue;
                yield item;
            }
        }, this, [test]);
    }

    public take(count: number): AsyncIterTools<T> {
        return this.takeWhile((_, i) => i < count);
    }

    public takeWhile(test: Selector<T, boolean>): AsyncIterTools<T> {
        return AsyncIterTools.create(async function* take(test: Selector<T, boolean>) {
            let i = 0;
            for await (const item of this) {
                if (!await test(item, i++))
                    break;
                yield item;
            }
        }, this, [test]);
    }

    public map<Result>(selector: Selector<T, Result>): AsyncIterTools<Result> {
        return AsyncIterTools.create(async function* map(selector: Selector<T, Result>) {
            let i = 0;
            for await (const item of this)
                yield await selector(item, i++);
        }, this, [selector]);
    }

    public filter(test: Selector<T, boolean>): AsyncIterTools<T>;
    public filter<Result extends T>(test: GuardSelector<T, Result>): AsyncIterTools<Result>;
    public filter(test: Selector<T, boolean>): AsyncIterTools<T> {
        return AsyncIterTools.create(async function* filter(test: Selector<T, boolean>) {
            let i = 0;
            for await (const item of this)
                if (await test(item, i++))
                    yield item;
        }, this, [test]);
    }

    public flat<Result>(this: AsyncIterable<Iterable<Result> | AsyncIterable<Result>>): AsyncIterTools<Result> {
        return AsyncIterTools.create(async function* flat() {
            for await (const item of this)
                yield* item;
        }, this, []);
    }

    public flatMap<Result>(selector: Selector<T, Iterable<Result> | AsyncIterable<Result>>): AsyncIterTools<Result> {
        return AsyncIterTools.create(async function* flatMap(selector: Selector<T, Iterable<Result> | AsyncIterable<Result>>) {
            let i = 0;
            for await (const item of this)
                yield* await selector(item, i++);
        }, this, [selector]);
    }

    public reverse(): AsyncIterTools<T> {
        return AsyncIterTools.create(async function* reverse() {
            const values = await this.toArray();
            for (let i = values.length - 1; i >= 0; i--)
                yield values[i];
        }, this, []);
    }

    public buffer(size: number): AsyncIterTools<T[]> {
        return AsyncIterTools.create(async function* buffer(size: number) {
            let buffer = [];
            for await (const item of this) {
                buffer.push(item);
                if (buffer.length === size) {
                    yield buffer;
                    buffer = [];
                }
            }
            if (buffer.length > 0)
                yield buffer;
        }, this, [size]);
    }

    public zip<Other>(other: AsyncIterable<Other>): AsyncIterTools<[T, Other]>;
    public zip<Other, Result>(other: AsyncIterable<Other>, resultSelector: (self: T, other: Other) => Awaitable<Result>): AsyncIterTools<Result>;
    public zip<Other>(other: AsyncIterable<Other>, resultSelector?: (self: T, other: Other) => Awaitable<unknown>): AsyncIterTools<unknown> | AsyncIterTools<[T, Other]> {
        resultSelector ??= (self, other) => [self, other] as const;

        return AsyncIterTools.create(async function* zip(other: AsyncIterable<Other>, resultSelector: (self: T, other: Other) => unknown) {
            const selfIterator = this[Symbol.asyncIterator]();
            const otherIterator = other[Symbol.asyncIterator]();

            let selfNext = await selfIterator.next();
            let otherNext = await otherIterator.next();
            while (selfNext.done !== true && otherNext.done !== true) {
                yield await resultSelector(selfNext.value, otherNext.value);
                selfNext = await selfIterator.next();
                otherNext = await otherIterator.next();
            }
        }, this, [other, resultSelector]);
    }

    public outerZip<Other, Result>(other: AsyncIterable<Other>, resultSelector: (self?: T, other?: Other) => Awaitable<Result>): AsyncIterTools<Result> {
        return AsyncIterTools.create(async function* zip(other: AsyncIterable<Other>, resultSelector: (self?: T, other?: Other) => Awaitable<Result>) {
            const selfIterator = this[Symbol.asyncIterator]();
            const otherIterator = other[Symbol.asyncIterator]();

            let selfNext = await selfIterator.next();
            let otherNext = await otherIterator.next();
            while (selfNext.done !== true || otherNext.done !== true) {
                yield await resultSelector(
                    selfNext.done === true ? undefined : selfNext.value,
                    otherNext.done === true ? undefined : otherNext.value);
                selfNext = await selfIterator.next();
                otherNext = await otherIterator.next();
            }
        }, this, [other, resultSelector]);
    }

    public concat(other: AsyncIterable<T>, ...others: Array<AsyncIterable<T>>): AsyncIterTools<T> {
        return AsyncIterTools.create(async function* concat(...others: Array<AsyncIterable<T>>) {
            yield* this;
            for await (const source of others)
                yield* source;
        }, this, [other, ...others]);
    }

    public prepend(value: T): AsyncIterTools<T> {
        // eslint-disable-next-line @typescript-eslint/require-await
        return AsyncIterTools.create(async function* prepend(value: T) {
            yield value;
            yield* this;
        }, this, [value]);
    }

    public append(value: T): AsyncIterTools<T> {
        // eslint-disable-next-line @typescript-eslint/require-await
        return AsyncIterTools.create(async function* append(value: T) {
            yield* this;
            yield value;
        }, this, [value]);
    }

    public sort(compareFn?: (left: T, right: T) => number): AsyncIterTools<T> {
        return AsyncIterTools.create(async function* (compareFn?: (left: T, right: T) => number) {
            yield* (await this.toArray()).sort(compareFn);
        }, this, [compareFn]);
    }

    public ifEmpty(value: T): AsyncIterTools<T> {
        return AsyncIterTools.create(async function* ifEmpty(value: T) {
            const iterator = this[Symbol.asyncIterator]();
            let next = await iterator.next();
            if (next.done === true)
                yield value;
            while (next.done !== true) {
                yield next.value;
                next = await iterator.next();
            }

        }, this, [value]);
    }
}

type IterableLike<T> = Iterable<T> | IterableIterator<T> | AsyncIterable<T> | AsyncIterableIterator<T>
function isIterator<T>(value: IterableLike<T>): value is IterableLike<T> & (Iterator<T> | AsyncIterator<T>) {
    return 'next' in value && typeof value.next === 'function';
}

function isAsyncIterable<T>(value: IterableLike<T>): value is AsyncIterable<T> {
    return Symbol.asyncIterator in value;
}

function toAsyncIterable<T>(source: Iterable<T> | AsyncIterable<T>): AsyncIterable<T> {
    if (isAsyncIterable(source))
        return source;
    return {
        [Symbol.asyncIterator]() {
            const iterator = source[Symbol.iterator]();
            const next = iterator.next.bind(iterator);
            const ret = iterator.return?.bind(iterator);
            const thr = iterator.throw?.bind(iterator);
            return {
                next: (...args) => Promise.resolve(next(...args)),
                return: ret === undefined ? undefined : (...args) => Promise.resolve(ret(...args)),
                throw: thr === undefined ? undefined : (...args) => Promise.resolve(thr(...args))
            };
        }
    };
}
