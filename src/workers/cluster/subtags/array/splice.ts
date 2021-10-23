import { BaseSubtag, BBTagContext, NotAnArrayError, NotANumberError } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class SpliceSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'splice',
            category: SubtagType.ARRAY,
            desc: 'If used with a variable this will modify the original array.\nReturns an array of removed items.',
            definition: [
                {
                    parameters: ['array', 'start', 'deleteCount?:0'],
                    description: 'Removes `deleteCount` elements from `array` starting at `start`.',
                    exampleCode: '{splice;["this", "is", "an", "array"];1;1}',
                    exampleOut: '["is"]',
                    execute: (ctx, [array, start, deleteCount]) => this.spliceArray(ctx, array.value, start.value, deleteCount.value, [])
                },
                {
                    parameters: ['array', 'start', 'deleteCount:0', 'items+'],
                    description: 'Removes `deleteCount` elements from `array` starting at `start`. ' +
                        'Then, adds each `item` at that position in `array`. Returns the removed items.',
                    exampleCode: '{set;~array;["this", "is", "an", "array"]} {splice;{get;~array};1;1;was} {get;~array}',
                    exampleOut: '["is"] {"v":["this","was","an","array"],"n":"~array"}',
                    execute: (ctx, [array, start, deleteCount, ...items]) => this.spliceArray(ctx, array.value, start.value, deleteCount.value, items.map(arg => arg.value))
                }
            ]
        });
    }

    public async spliceArray(
        context: BBTagContext,
        arrayStr: string,
        startStr: string,
        countStr: string,
        replaceItems: string[]
    ): Promise<JArray> {
        const { n: varName, v: array } = await bbtagUtil.tagArray.resolve(context, arrayStr) ?? {};

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        const fallback = new Lazy<number>(() => parse.int(context.scope.fallback ?? ''));
        const start = parse.int(startStr, false) ?? fallback.value;
        if (isNaN(start))
            throw new NotANumberError(startStr);

        const count = parse.int(countStr, false) ?? fallback.value;
        if (isNaN(count))
            throw new NotANumberError(countStr);

        const insert = bbtagUtil.tagArray.flattenArray(replaceItems);
        const result = array.splice(start, count, ...insert);

        if (varName !== undefined)
            await context.variables.set(varName, array);

        return result;
    }
}
