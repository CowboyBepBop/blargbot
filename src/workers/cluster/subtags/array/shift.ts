import { BaseSubtag, BBTagContext, NotAnArrayError } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class ShiftSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'shift',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array'],
                    description: 'Returns the first element in `array`. If used with a variable this will remove the first element from `array` as well.',
                    exampleCode: '{shift;["this", "is", "an", "array"]}',
                    exampleOut: 'this',
                    execute: (context, [array]) => this.shift(context, array.value)
                }
            ]
        });
    }

    public async shift(context: BBTagContext, arrayStr: string): Promise<JToken | undefined> {
        const { n: varName, v: array } = await bbtagUtil.tagArray.resolve(context, arrayStr) ?? {};
        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        if (array.length === 0)
            return undefined;

        const result = array.shift();
        if (varName !== undefined)
            await context.variables.set(varName, array);

        return result;
    }
}
