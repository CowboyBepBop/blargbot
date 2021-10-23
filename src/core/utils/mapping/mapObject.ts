import { TypeMapping, TypeMappingOptions, TypeMappings } from '@core/types';

import * as guard from '../guard';
import { result as _result } from './result';

export function mapObject<T>(mappings: TypeMappings<T>): TypeMapping<T>;
export function mapObject<T>(mappings: TypeMappings<T>, options: TypeMappingOptions<T, T>): TypeMapping<T>;
export function mapObject<T, R>(mappings: TypeMappings<T>, options: TypeMappingOptions<T, R>): TypeMapping<T | R>;
export function mapObject<T, R>(mappings: TypeMappings<T>, options: TypeMappingOptions<T, R> = {}): TypeMapping<T | R> {
    return value => {
        if (value === undefined)
            return options.ifUndefined ?? _result.never;
        if (typeof value !== 'object')
            return _result.never;
        if (value === null)
            return options.ifNull ?? _result.never;

        const objValue = <Record<PropertyKey, unknown>>value;
        const result = options.initial?.() ?? {} as Partial<T>;
        const remainingKeys = new Set<PropertyKey>(Object.keys(objValue));

        function checkKey<K extends keyof T>(resultKey: K, sourceKey: PropertyKey | undefined, mapping: TypeMapping<T[K]>): boolean {
            if (sourceKey !== undefined) {
                if (!guard.hasProperty(objValue, sourceKey))
                    return mapping(undefined).valid;
                remainingKeys.delete(sourceKey);
            }
            const val = sourceKey === undefined ? undefined : objValue[sourceKey];
            const mapped = mapping(val);
            if (!mapped.valid)
                return false;
            if (<unknown>mapped.value !== undefined)
                result[resultKey] = mapped.value;
            return true;
        }

        for (const [resultKey, mapping] of Object.entries<keyof T, TypeMappings<T>[keyof T]>(mappings)) {
            if (!checkKey(resultKey, ...splitMapping(resultKey, mapping)))
                return _result.never;
        }

        if (options.strict === true && remainingKeys.size > 0)
            return _result.never;

        return { valid: true, value: <T>result };
    };
}

function splitMapping<T, K extends keyof T>(key: K, mapping: TypeMappings<T>[K]): [PropertyKey | undefined, TypeMapping<T[K]>] {
    if (typeof mapping !== 'object')
        return [key, mapping];

    if (mapping.length === 1)
        return [undefined, () => ({ valid: true, value: mapping[0] })];

    return mapping;
}
