import { TypeMapping, TypeMappingOptions } from '@core/types';

import { result as _result } from './result';

export function mapRecord<T>(mapping: TypeMapping<T, [key: string]>): TypeMapping<Record<string, T>>;
export function mapRecord<T>(mapping: TypeMapping<T, [key: string]>, options: TypeMappingOptions<Record<string, T>, T>): TypeMapping<Record<string, T>>;
export function mapRecord<T, R>(mapping: TypeMapping<T, [key: string]>, options: TypeMappingOptions<Record<string, T>, R>): TypeMapping<Record<string, T> | R>;
export function mapRecord<T, R>(mapping: TypeMapping<T, [key: string]>, options: TypeMappingOptions<Record<string, T>, R> = {}): TypeMapping<Record<string, T> | R> {
    return toMap => {
        if (toMap === undefined)
            return options.ifUndefined ?? _result.never;
        if (typeof toMap !== 'object')
            return _result.never;
        if (toMap === null)
            return options.ifNull ?? _result.never;

        const result: Record<string, T> = options.initial?.() ?? {} as Record<string, T>;
        for (const [key, value] of Object.entries<PropertyKey, unknown>(toMap)) {
            const mapped = mapping(value, key);
            if (!mapped.valid)
                return _result.never;
            result[key] = mapped.value;
        }
        return { valid: true, value: result };
    };
}
