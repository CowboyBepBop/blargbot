import { BaseSubtag, BBTagContext, BBTagRuntimeError, NotAnArrayError } from '@cluster/bbtag';
import { bbtagUtil, compare, parse, SubtagType } from '@cluster/utils';

export class JsonSortSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonsort',
            category: SubtagType.JSON,
            aliases: ['jsort'],
            definition: [
                {
                    parameters: ['array', 'path', 'descending?'],
                    description: 'Sorts an array of objects based on the provided `path`.\n' +
                        '`path` is a dot-noted series of properties.\n' +
                        'If `descending` is provided, sorts in descending order.\n' +
                        'If provided a variable, will modify the original `array`.',
                    exampleCode: '{set;~array;{json;[\n  {"points" : 10, "name" : "Blargbot"},\n  {"points" : 3, "name" : "UNO"},\n' +
                        '  {"points" : 6, "name" : "Stupid cat"},\n  {"points" : 12, "name" : "Winner"}\n]}}\n' +
                        '{jsonstringify;{jsonsort;{slice;{get;~array};0};points};2}',
                    exampleOut: '[\n  "{\\"points\\":3,\\"name\\":\\"UNO\\"}",\n  "{\\"points\\":6,\\"name\\":\\"Stupid cat\\"}",' +
                        '\n  "{\\"points\\":10,\\"name\\":\\"Blargbot\\"}",\n  "{\\"points\\":12,\\"name\\":\\"Winner\\"}"\n]',
                    execute: (ctx, [array, path, descending]) => this.sortJson(ctx, array.value, path.value, descending.value)
                }
            ]
        });
    }

    public async sortJson(context: BBTagContext, arrayStr: string, path: string, descendingStr: string): Promise<JArray | undefined> {
        const descending = parse.boolean(descendingStr) ?? descendingStr !== '';
        const { n: varName, v: array } = await bbtagUtil.tagArray.resolve(context, arrayStr) ?? {};
        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        if (path === '')
            throw new BBTagRuntimeError('No path provided');

        const pathSegments = path.split('.');
        const mappedArray = array.map(item => {
            try {
                let baseObj: JObject | JArray;
                if (typeof item === 'string')
                    baseObj = bbtagUtil.json.parseSync(item);
                else if (typeof item !== 'object' || item === null)
                    baseObj = {};
                else
                    baseObj = item;

                const valueAtPath = bbtagUtil.json.get(baseObj, pathSegments);
                return valueAtPath;
            } catch (e: unknown) {
                return undefined;
            }
        });

        const undefinedItems = mappedArray.filter(v => v === undefined);
        if (undefinedItems.length !== 0)
            throw new BBTagRuntimeError(`Cannot read property ${pathSegments.join('.')} at index ${mappedArray.indexOf(undefined)}, ${undefinedItems.length} total failures`);

        const direction = descending ? -1 : 1;
        const result = array.sort((a, b) => {
            let aObj: JObject | JArray;
            let bObj: JObject | JArray;
            if (typeof a === 'string')
                aObj = bbtagUtil.json.parseSync(a);
            else if (typeof a === 'object' && a !== null)
                aObj = a;
            else
                aObj = {};
            if (typeof b === 'string')
                bObj = bbtagUtil.json.parseSync(b);
            else if (typeof b === 'object' && b !== null)
                bObj = b;
            else
                bObj = {};

            const aValue = bbtagUtil.json.get(aObj, pathSegments);
            let aValueString: string;
            if (typeof aValue === 'object' && aValue !== null)
                aValueString = JSON.stringify(aValue);
            else if (aValue !== undefined && aValue !== null)
                aValueString = aValue.toString();
            else
                aValueString = '';
            const bValue = bbtagUtil.json.get(bObj, pathSegments);
            let bValueString: string;
            if (typeof bValue === 'object' && bValue !== null)
                bValueString = JSON.stringify(bValue);
            else if (bValue !== undefined && bValue !== null)
                bValueString = bValue.toString();
            else
                bValueString = '';
            return direction * compare(aValueString, bValueString);
        });

        if (varName === undefined)
            return result;

        await context.variables.set(varName, result);
        return undefined;
    }
}
