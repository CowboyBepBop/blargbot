import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class MapSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'map',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'Provides a way to populate an array by executing a function on each of its elements,' +
                        ' more info [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)\n' +
                        'For every element in `array`, a variable called `variable` will be set to the current element. The output of `function`' +
                        ' will be the new value of the element. This will return the new array, and will not modify the original.',
                    exampleCode: '{map;~item;["apples","oranges","pears"];{upper;{get;~item}}}',
                    exampleOut: '["APPLES","ORANGES","PEARS"]',
                    execute: (context, [varName, array, code]) => this.map(context, varName.value, array.value, code)
                }
            ]
        });
    }

    public async map(context: BBTagContext, varName: string, arrayStr: string, code: SubtagArgumentValue): Promise<JArray> {
        const { v: array } = await bbtagUtil.tagArray.resolve(context, arrayStr) ?? {};
        if (array === undefined || array.length === 0)
            return [];

        const result = [];
        try {
            for (const item of array) {
                await context.limit.check(context, 'map:loops');
                await context.variables.set(varName, item);

                result.push(await code.execute());
            }
        } finally {
            await context.variables.reset(varName);
        }

        return result;
    }
}
