import { AsyncIterTools } from './asyncIterTools';

type Selector<Source, Result> = (value: Source, index: number) => Result;
type GuardSelector<Source, Result extends Source> = (value: Source, index: number) => value is Result;

export class IterTools<T> implements Iterable<T> {
    public static create<Item, Args extends unknown[], This>(generatorFn: (this: This, ...args: Args) => Iterator<Item>, thisArg: This, args: Args): IterTools<Item> {
        return new IterTools({
            [Symbol.iterator]() {
                return generatorFn.call(thisArg, ...args);
            }
        });
    }

    public static from<Item>(source: Iterable<Item>): IterTools<Item> {
        if (isIterator(source))
            return new IterTools(source).memoize();
        return new IterTools(source);
    }

    public static yield<Item>(...values: Item[]): IterTools<Item> {
        return new IterTools(values);
    }

    public static empty<T>(): IterTools<T> {
        return IterTools.yield();
    }

    public static isIterable<T>(value: unknown): value is Iterable<T> {
        return typeof value === 'object'
            && value !== null
            && Symbol.iterator in value
            && typeof (<Iterable<T>>value)[Symbol.iterator] === 'function';
    }

    public static range(start: number, end: number, step?: number): IterTools<number> {
        step ??= start < end ? 1 : -1;
        if (step > 0) {
            return IterTools.create(function* rangeNegative(start: number, end: number, step: number) {
                for (let i = start; i < end; i += step)
                    yield i;
            }, this, [start, end, step]);
        }
        if (step < 0) {
            return IterTools.create(function* rangePositive(start: number, end: number, step: number) {
                for (let i = start; i > end; i += step)
                    yield i;
            }, this, [start, end, step]);
        }
        throw new Error(`Step size cannot be ${step}`);
    }

    public static repeat<T>(value: T, count: number): IterTools<T> {
        if (count < 0)
            throw new Error('Cannot repeat something a negative amount of times');
        if (count % 1 !== 0)
            throw new Error('Cannot repeat something a fractional number of times');
        return IterTools.create(function* repeat(value: T, count: number) {
            for (let i = 0; i < count; i++)
                yield value;
        }, this, [value, count]);
    }

    public get async(): AsyncIterTools<T> { return AsyncIterTools.from(this); }

    private constructor(private readonly source: Iterable<T>) {
    }

    public [Symbol.iterator](): Iterator<T> {
        return this.source[Symbol.iterator]();
    }

    public memoize(): IterTools<T> {
        const cache: T[] = [];
        const iterator = this[Symbol.iterator]();
        let done = false;
        return IterTools.create(function* memoize() {
            yield* cache;
            while (!done) {
                const next = iterator.next();
                if (next.done === true) {
                    done = true;
                    break;
                }
                cache.push(next.value);
                yield next.value;
            }
        }, undefined, []);
    }

    public first(test?: Selector<T, boolean>, ifNoMatches?: () => T): T;
    public first<Result>(test?: Selector<T, boolean>, ifNoMatches?: () => T | Result): T | Result;
    public first<Result extends T>(test: GuardSelector<T, Result>, ifNoMatches?: () => Result): Result;
    public first(test?: Selector<T, boolean>, ifNoMatches?: () => T): T {
        for (const item of test === undefined ? this : this.filter(test))
            return item;
        if (ifNoMatches === undefined)
            throw new Error('Sequence contained no elements');
        return ifNoMatches();
    }

    public single(test?: Selector<T, boolean>, ifNoMatches?: () => T): T;
    public single<Result>(test?: Selector<T, boolean>, ifNoMatches?: () => T | Result): T | Result;
    public single<Result extends T>(test: GuardSelector<T, Result>, ifNoMatches?: () => Result): Result;
    public single(test?: Selector<T, boolean>, ifNoMatches?: () => T): T {
        let result: { value: T; } | undefined;
        for (const item of test === undefined ? this : this.filter(test)) {
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

    public last(test?: Selector<T, boolean>, ifNoMatches?: () => T): T;
    public last<Result>(test?: Selector<T, boolean>, ifNoMatches?: () => T | Result): T | Result;
    public last<Result extends T>(test: GuardSelector<T, Result>, ifNoMatches?: () => Result): Result;
    public last(test?: Selector<T, boolean>, ifNoMatches?: () => T): T {
        const iterator = (test === undefined ? this : this.filter(test))[Symbol.iterator]();
        let result = iterator.next();
        while (result.done !== true) {
            const next = iterator.next();
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

    public toArray(): T[] {
        return [...this];
    }

    public toSet(): Set<T> {
        return new Set(this);
    }

    public contains(value: T): boolean {
        return this.containsFn(v => v === value);
    }

    public containsFn(test: Selector<T, boolean>): boolean {
        let i = 0;
        for (const item of this)
            if (test(item, i++))
                return true;
        return false;
    }

    public count(test?: Selector<T, boolean>): number {
        let i = 0;
        let count = 0;
        test ??= () => true;
        for (const item of this)
            if (test(item, i++))
                count++;
        return count;
    }

    public join(separator?: string): string {
        const result = [];
        for (const item of this)
            result.push(item);
        return result.join(separator);
    }

    public reduce(reduceFn: (accumulator: T, item: T, index: number) => T): T;
    public reduce<Result>(reduceFn: (accumulator: Result, item: T, index: number) => Result, initial: Result): Result;
    public reduce(reduceFn: (accumulator: T, item: T, index: number) => T, initial?: T): T {
        let source = this as IterTools<T>;
        if (initial === undefined) {
            source = this.memoize();
            initial = source.first();
            source = source.skip(1);
        }
        let i = 0;
        for (const item of source)
            initial = reduceFn(initial, item, i++);
        return initial;
    }

    public toMap<Key, Value>(this: Iterable<[Key, Value]>): Map<Key, Value>;
    public toMap<Key>(keySelector: Selector<T, Key>): Map<Key, T>;
    public toMap<Key, Value>(keySelector: Selector<T, Key>, valueSelector: Selector<T, Value>): Map<Key, Value>;
    public toMap(keySelector?: Selector<T, unknown>, valueSelector?: Selector<T, unknown>): Map<unknown, unknown> {
        if (keySelector === undefined) {
            keySelector = v => (<unknown[]><unknown>v)[0];
            valueSelector = v => (<unknown[]><unknown>v)[1];
        } else if (valueSelector === undefined) {
            valueSelector = v => v;
        }

        const result = new Map<unknown, unknown>();
        const keys = new Set<unknown>();
        let i = 0;
        for (const item of this) {
            const key = keySelector(item, i);
            if (keys.size === keys.add(key).size)
                throw new Error('Duplicate key found');
            const value = valueSelector(item, i++);
            result.set(key, value);
        }
        return result;
    }

    public skip(count: number): IterTools<T> {
        return this.skipWhile((_, i) => i < count);
    }

    public skipWhile(test: Selector<T, boolean>): IterTools<T> {
        return IterTools.create(function* skip(test: Selector<T, boolean>) {
            let i = 0;
            for (const item of this) {
                if (test(item, i++))
                    continue;
                yield item;
            }
        }, this, [test]);
    }

    public take(count: number): IterTools<T> {
        return this.takeWhile((_, i) => i < count);
    }

    public takeWhile(test: Selector<T, boolean>): IterTools<T> {
        return IterTools.create(function* take(test: Selector<T, boolean>) {
            let i = 0;
            for (const item of this) {
                if (!test(item, i++))
                    break;
                yield item;
            }
        }, this, [test]);
    }

    public map<Result>(selector: Selector<T, Result>): IterTools<Result> {
        return IterTools.create(function* map(selector: Selector<T, Result>) {
            let i = 0;
            for (const item of this)
                yield selector(item, i++);
        }, this, [selector]);
    }

    public filter(test: Selector<T, boolean>): IterTools<T>;
    public filter<Result extends T>(test: GuardSelector<T, Result>): IterTools<Result>;
    public filter(test: Selector<T, boolean>): IterTools<T> {
        return IterTools.create(function* filter(test: Selector<T, boolean>) {
            let i = 0;
            for (const item of this)
                if (test(item, i++))
                    yield item;
        }, this, [test]);
    }

    public flat<Result>(this: Iterable<Iterable<Result>>): IterTools<Result> {
        return IterTools.create(function* flat() {
            for (const item of this)
                yield* item;
        }, this, []);
    }

    public flatMap<Result>(selector: Selector<T, Iterable<Result>>): IterTools<Result> {
        return IterTools.create(function* flatMap(selector: Selector<T, Iterable<Result>>) {
            let i = 0;
            for (const item of this)
                yield* selector(item, i++);
        }, this, [selector]);
    }

    public reverse(): IterTools<T> {
        return IterTools.create(function* reverse() {
            const values = this.toArray();
            for (let i = values.length - 1; i >= 0; i--)
                yield values[i];
        }, this, []);
    }

    public buffer(size: number): IterTools<T[]> {
        if (size < 1)
            throw new Error('The minimum buffer size is 1');
        if (size % 1 !== 0)
            throw new Error('Cannot have a fractional buffer size');
        return IterTools.create(function* buffer(size: number) {
            let buffer = [];
            for (const item of this) {
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

    public zip<Other>(other: Iterable<Other>): IterTools<[T, Other]>;
    public zip<Other, Result>(other: Iterable<Other>, resultSelector: (self: T, other: Other) => Result): IterTools<Result>;
    public zip<Other>(other: Iterable<Other>, resultSelector?: (self: T, other: Other) => unknown): IterTools<unknown> | IterTools<[T, Other]> {
        resultSelector ??= (self, other) => [self, other] as const;

        return IterTools.create(function* zip(other: Iterable<Other>, resultSelector: (self: T, other: Other) => unknown) {
            const selfIterator = this[Symbol.iterator]();
            const otherIterator = other[Symbol.iterator]();

            let selfNext = selfIterator.next();
            let otherNext = otherIterator.next();
            while (selfNext.done !== true && otherNext.done !== true) {
                yield resultSelector(selfNext.value, otherNext.value);
                selfNext = selfIterator.next();
                otherNext = otherIterator.next();
            }
        }, this, [other, resultSelector]);
    }

    public outerZip<Other, Result>(other: Iterable<Other>, resultSelector: (self?: T, other?: Other) => Result): IterTools<Result> {
        return IterTools.create(function* zip(other: Iterable<Other>, resultSelector: (self?: T, other?: Other) => Result) {
            const selfIterator = this[Symbol.iterator]();
            const otherIterator = other[Symbol.iterator]();

            let selfNext = selfIterator.next();
            let otherNext = otherIterator.next();
            while (selfNext.done !== true || otherNext.done !== true) {
                yield resultSelector(
                    selfNext.done === true ? undefined : selfNext.value,
                    otherNext.done === true ? undefined : otherNext.value);
                selfNext = selfIterator.next();
                otherNext = otherIterator.next();
            }
        }, this, [other, resultSelector]);
    }

    public repeat(count: number): IterTools<T> {
        return IterTools.repeat(this, count).flat();
    }

    public concat(other: Iterable<T>, ...others: Array<Iterable<T>>): IterTools<T> {
        return IterTools.create(function* concat(...others: Array<Iterable<T>>) {
            yield* this;
            for (const source of others)
                yield* source;
        }, this, [other, ...others]);
    }

    public prepend(value: T): IterTools<T> {
        return IterTools.create(function* prepend(value: T) {
            yield value;
            yield* this;
        }, this, [value]);
    }

    public append(value: T): IterTools<T> {
        return IterTools.create(function* append(value: T) {
            yield* this;
            yield value;
        }, this, [value]);
    }

    public finally(action: () => void): IterTools<T> {
        return IterTools.from({
            [Symbol.iterator]: () => {
                const iterator = this[Symbol.iterator]();
                let _action: typeof action | undefined = () => {
                    action();
                    _action = undefined;
                };
                return <Iterator<T> & { close(): void; }>{
                    get next(): Iterator<T>['next'] {
                        const bound = iterator.next.bind(iterator);
                        if (_action === undefined)
                            return bound;

                        const action = _action;
                        return (...args) => {
                            try {
                                const result = bound(...args);
                                if (result.done === true)
                                    action();
                                return result;
                            } catch (err: unknown) {
                                action();
                                throw err;
                            }
                        };
                    },
                    get return(): Iterator<T>['return'] {
                        const bound = iterator.return?.bind(iterator);
                        if (bound === undefined || _action === undefined)
                            return bound;

                        const action = _action;
                        return (...args) => {
                            try {
                                return bound(...args);
                            } finally {
                                action();
                            }
                        };
                    },
                    get throw(): Iterator<T>['throw'] {
                        const bound = iterator.throw?.bind(iterator);
                        if (bound === undefined || _action === undefined)
                            return bound;

                        const action = _action;
                        return (...args) => {
                            try {
                                return bound(...args);
                            } finally {
                                action();
                            }
                        };
                    }
                };
            }
        });
    }

    public sort(compareFn?: (left: T, right: T) => number): IterTools<T> {
        return IterTools.create(function* (compareFn?: (left: T, right: T) => number) {
            yield* this.toArray().sort(compareFn);
        }, this, [compareFn]);
    }

    public ifEmpty(value: T): IterTools<T> {
        return IterTools.create(function* ifEmpty(value: T) {
            const iterator = this[Symbol.iterator]();
            let next = iterator.next();
            if (next.done === true)
                yield value;
            while (next.done !== true) {
                yield next.value;
                next = iterator.next();
            }

        }, this, [value]);
    }
}

function isIterator<T>(value: Iterable<T> | IterableIterator<T>): value is (Iterable<T> & Iterator<T>) | IterableIterator<T> {
    return 'next' in value && typeof value.next === 'function';
}
