export interface IFormatStringDefinition<T extends string, V = never> {
    readonly id: string;
    readonly template: T;
    (value: V): IFormatString<T>;
}

export const format: unique symbol = Symbol('format');

export interface IFormattable<T> {
    [format](formatter: IFormatter): T;
}

export interface IFormatString<T extends string = string> extends IFormattable<string> {
    readonly id: string;
    readonly template: T;
    readonly value: unknown;
}

export interface IFormatter {
    readonly locale: Intl.Locale;
    format(string: IFormatString): string;
}

export function literal<T>(value: Exclude<T, undefined>): IFormattable<T>;
export function literal<T>(value: T | undefined): IFormattable<T> | undefined;
export function literal<T>(value: T | undefined): IFormattable<T> | undefined {
    if (value === undefined)
        return undefined;
    return {
        [format]() {
            return value;
        }
    };
}

export function isFormattable(value: unknown): value is IFormattable<unknown> {
    return typeof value === 'object'
        && value !== null
        && format in value
        && typeof (value as { [format]: unknown; })[format] === 'function';
}
