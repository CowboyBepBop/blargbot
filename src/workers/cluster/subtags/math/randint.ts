import { BaseSubtag, BBTagContext, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class RandIntSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'randint',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['min?:0', 'max'],
                    description: 'Chooses a random whole number between `min` and `max` (inclusive). `min` defaults to 0.',
                    exampleCode: 'You rolled a {randint;1;6}.',
                    exampleOut: 'You rolled a 5.',
                    execute: (ctx, [min, max]) => this.randInt(ctx, min.value, max.value)
                }
            ]
        });
    }

    public randInt(
        context: BBTagContext,
        minStr: string,
        maxStr: string
    ): string {
        const fallback = new Lazy(() => parse.int(context.scope.fallback ?? ''));
        let min = parse.int(minStr, false) ?? fallback.value;
        if (isNaN(min))
            throw new NotANumberError(minStr);

        let max = parse.int(maxStr, false) ?? fallback.value;
        if (isNaN(max))
            throw new NotANumberError(maxStr);

        if (min > max)
            [min, max] = [max, min];

        return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
    }
}
