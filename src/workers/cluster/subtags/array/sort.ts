import { BaseSubtag, BBTagContext, NotAnArrayError } from '@cluster/bbtag';
import { bbtagUtil, compare, parse, SubtagType } from '@cluster/utils';

export class SortSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'sort',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'descending?:false'],
                    description: 'Sorts the `array` in ascending order. ' +
                        'If `descending` is provided, sorts in descending order. ' +
                        'If provided a variable, will modify the original `array`.',
                    exampleCode: '{sort;[3, 2, 5, 1, 4]}',
                    exampleOut: '[1,2,3,4,5]',
                    execute: (context, [array, descending]) => this.sort(context, array.value, descending.value)
                }
            ]
        });
    }

    public async sort(context: BBTagContext, arrayStr: string, descending: string): Promise<JArray | undefined> {
        const { n: varName, v: array } = await bbtagUtil.tagArray.resolve(context, arrayStr) ?? {};
        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        const direction = parse.boolean(descending, true) ? -1 : 1;
        const result = array.sort((a, b) => direction * compare(parse.string(a), parse.string(b)));

        if (varName === undefined)
            return result;

        await context.variables.set(varName, result);
        return undefined;
    }
}
