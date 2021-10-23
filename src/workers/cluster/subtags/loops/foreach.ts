import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class ForeachSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'foreach',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'For every element in `array`, a variable called `variable` will be set and then `code` will be run.\n' +
                        'If `element` is not an array, it will iterate over each character intead.',
                    exampleCode: '{set;~array;apples;oranges;c#}\n{foreach;~element;~array;I like {get;~element}{newline}}',
                    exampleOut: 'I like apples\nI like oranges\nI like c#',
                    execute: (ctx, [varName, array, code]) => this.foreach(ctx, varName.value, array.value, code)
                }
            ]
        });
    }

    public async * foreach(context: BBTagContext, varName: string, arrayStr: string, code: SubtagArgumentValue): AsyncGenerator<string> {
        const { v: array } = await bbtagUtil.tagArray.resolve(context, arrayStr) ?? { v: arrayStr };
        for (const item of array) {
            await context.limit.check(context, 'foreach:loops');
            await context.variables.set(varName, item);
            yield await code.execute();
        }
        await context.variables.reset(varName);
    }
}
