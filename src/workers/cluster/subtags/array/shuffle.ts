import { BaseSubtag, BBTagContext, NotAnArrayError } from '@cluster/bbtag';
import { bbtagUtil, shuffle, SubtagType } from '@cluster/utils';

export class ShuffleSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'shuffle',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: [],
                    description: 'Shuffles the `{args}` the user provided.',
                    exampleCode: '{shuffle} {args;0} {args;1} {args;2}',
                    exampleIn: 'one two three',
                    exampleOut: 'three one two',
                    execute: (ctx) => this.shuffleInput(ctx)
                },
                {
                    parameters: ['array'],
                    description: 'Shuffles the `{args}` the user provided, or the elements of `array`. If used with a variable this will modify the original array',
                    exampleCode: '{shuffle;[1,2,3,4,5,6]}',
                    exampleOut: '[5,3,2,6,1,4]',
                    execute: (context, [array]) => this.shuffle(context, array.value)
                }
            ]
        });
    }

    public shuffleInput(context: BBTagContext): undefined {
        shuffle(context.input);
        return undefined;
    }

    public async shuffle(context: BBTagContext, arrayStr: string): Promise<JArray | undefined> {
        const { n: varName, v: array } = bbtagUtil.tagArray.deserialize(arrayStr) ?? {};
        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        shuffle(array);
        if (varName === undefined)
            return array;

        await context.variables.set(varName, array);
        return undefined;
    }
}
