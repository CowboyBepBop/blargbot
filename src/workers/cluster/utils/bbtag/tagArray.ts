import { BBTagContext } from '@cluster/bbtag';
import { BBTagArray } from '@cluster/types';
import { getRange, mapping, parse } from '@core/utils';

export function serialize(array: JArray | BBTagArray, varName?: string): string {
    if (Array.isArray(array)) {
        if (varName === undefined || varName.length === 0)
            return JSON.stringify(array);
        return JSON.stringify({ n: varName, v: array });
    }

    if (varName === undefined || varName.length === 0)
        return JSON.stringify(array);
    return JSON.stringify({
        v: 'v' in array ? array.v : undefined,
        n: varName
    });
}

export function deserialize(value: string): BBTagArray | undefined {
    let result = mapBBArray(value);
    if (!result.valid) {
        value = value.replace(
            /([[,]\s*)(\d+)\s*\.\.\.\s*(\d+)(\s*[\],])/gi,
            (_, ...[before, from, to, after]: string[]) =>
                before + getRange(parse.int(from), parse.int(to)).join(',') + after);
        result = mapBBArray(value);
    }

    if (!result.valid)
        return undefined;
    if (Array.isArray(result.value))
        return { v: result.value };
    return result.value;
}

const mapBBArray = mapping.mapJson(
    mapping.mapChoice(
        mapping.mapArray(mapping.mapJToken),
        mapping.mapObject<BBTagArray>({
            n: mapping.mapOptionalString,
            v: mapping.mapInstanceof<JArray>(Array)
        })
    )
);

export function flattenArray(array: JArray): JArray {
    const result = [];
    for (const arg of array) {
        const arr = typeof arg === 'string' ? deserialize(arg) : { v: arg };
        if (arr !== undefined && Array.isArray(arr.v))
            result.push(...arr.v);
        else result.push(arg);
    }
    return result;
}

export async function resolve(context: BBTagContext, arrName: string): Promise<BBTagArray | undefined> {
    const obj = deserialize(arrName);
    if (obj !== undefined)
        return obj;

    return await get(context, arrName);
}

export async function get(context: BBTagContext, arrName: string): Promise<BBTagArray | undefined> {
    const arr = await context.variables.get(arrName);
    if (arr !== undefined && Array.isArray(arr))
        return { v: arr, n: arrName };

    return undefined;
}
