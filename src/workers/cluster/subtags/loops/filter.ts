import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, overrides, parse, SubtagType } from '@cluster/utils';

export class FilterSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'filter',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'For every element in `array`, a variable called `variable` will be set and `code` will be executed. Returns a new array containing all the elements that returned the value `true`.' +
                        '\n\n While inside the `code` parameter, none of the following subtags may be used: `' + overrides.filter.join(', ') + '`',
                    exampleCode: '{set;~array;apples;apple juice;grapefruit}\n{filter;~element;~array;{bool;{get;~element};startswith;apple}}',
                    exampleOut: '["apples","apple juice"]',
                    execute: (ctx, [varName, array, code]) => this.filter(ctx, varName.value, array.value, code)
                }
            ]
        });
    }

    public async filter(context: BBTagContext, varName: string, arrayStr: string, code: SubtagArgumentValue): Promise<JArray> {
        const { v: array } = await bbtagUtil.tagArray.resolve(context, arrayStr) ?? { v: arrayStr };
        const result = [];

        const childContext = context.makeChild();
        const subtagOverrides = overrides.filter.map(name => childContext.disableSubtag(name, this.name));

        for (const item of array) {
            await context.limit.check(context, 'filter:loops');
            await context.variables.set(varName, item);

            if (parse.boolean(await code.execute()) === true)
                result.push(item);
        }

        await context.variables.reset(varName);
        for (const override of subtagOverrides)
            override.reset();

        return result;
    }
}
