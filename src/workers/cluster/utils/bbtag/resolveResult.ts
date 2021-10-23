import { SubtagConstantResult, SubtagResult } from '@cluster/types';
import { AsyncIterTools } from '@core/utils/asyncIterTools';
import { IterTools } from '@core/utils/iterTools';

export function resolveResult(value: SubtagConstantResult): IterTools<string>;
export function resolveResult(value: SubtagResult): IterTools<string> | AsyncIterTools<string>
export function resolveResult(value: SubtagResult): IterTools<string> | AsyncIterTools<string> {
    switch (typeof value) {
        case 'string':
        case 'boolean':
        case 'number':
            return IterTools.yield(resolveValue(value));
        case 'undefined':
        case 'object':
            if (value === null || value === undefined)
                return IterTools.yield();
            if (isIterable(value) && !Array.isArray(value))
                return IterTools.from(value).map(resolveValue);
            if (isAsyncIterable(value))
                return AsyncIterTools.from(value).map(resolveValue);
            return IterTools.yield(JSON.stringify(value));
    }
}
function resolveValue(value: JToken): string {
    switch (typeof value) {
        case 'string':
            return value;
        case 'boolean':
        case 'number':
            return value.toString();
        case 'undefined':
        case 'object':
            if (value === null || value === undefined)
                return '';
            return JSON.stringify(value);
    }
}
function isIterable<T>(value: unknown): value is Iterable<T> {
    return typeof value === 'object' && value !== null && Symbol.iterator in value;
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
    return typeof value === 'object' && value !== null && Symbol.asyncIterator in value;
}
