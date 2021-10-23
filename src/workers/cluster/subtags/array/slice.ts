import { BaseSubtag, BBTagContext, NotAnArrayError, NotANumberError } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class SliceSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'slice',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'start', 'end?'],
                    description: '`end` defaults to the length of the array.\n\n' +
                        'Grabs elements between the zero-indexed `start` and `end` points (inclusive) from `array`.',
                    exampleCode: '{slice;["this", "is", "an", "array"];1}',
                    exampleOut: '["is","an","array"]',
                    execute: (context, [array, start, end]) => this.slice(context, array.value, start.value, end.value)
                }
            ]
        });
    }

    public async slice(context: BBTagContext, arrayStr: string, startStr: string, endStr: string): Promise<JArray> {
        const { v: array } = await bbtagUtil.tagArray.resolve(context, arrayStr) ?? {};
        const fallback = new Lazy<number>(() => parse.int(context.scope.fallback ?? ''));

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        const start = parse.int(startStr, false) ?? fallback.value;
        if (isNaN(start))
            throw new NotANumberError(startStr);

        const end = parse.int(endStr === '' ? array.length : endStr, false) ?? fallback.value;
        if (isNaN(end))
            throw new NotANumberError(endStr);

        return array.slice(start, end);
    }
}
