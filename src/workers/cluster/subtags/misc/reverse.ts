import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class ReverseSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'reverse',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Reverses the order of `text`. If `text` is an array, the array will be reversed. If `{get}` is used with an array, this will modify the original array.',
                    exampleCode: '{reverse;palindrome}',
                    exampleOut: 'emordnilap',
                    execute: (ctx, [text]) => this.reverse(ctx, text.value)
                }
            ]
        });
    }

    public async reverse(context: BBTagContext, value: string): Promise<string | JArray | undefined> {
        const { n: varName, v: array } = await bbtagUtil.tagArray.resolve(context, value) ?? {};
        if (array === undefined)
            return value.split('').reverse().join('');

        array.reverse();
        if (varName === undefined)
            return array;

        await context.variables.set(varName, array);
        return undefined;
    }
}
