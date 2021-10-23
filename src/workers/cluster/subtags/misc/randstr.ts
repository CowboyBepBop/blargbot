import { BaseSubtag, BBTagContext, BBTagRuntimeError, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class RandStrSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'randstr',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['chars', 'length'],
                    description: 'Creates a random string with characters from `chars` that is `length` characters long.',
                    exampleCode: '{randstr;abcdefghijklmnopqrstuvwxyz;9}',
                    exampleOut: 'kgzyqcvda',
                    execute: (ctx, [chars, length]) => this.randStr(ctx, chars.value, length.value)
                }
            ]
        });
    }

    public randStr(context: BBTagContext, charsStr: string, countStr: string): string {
        const chars = charsStr.split('');
        const fallback = new Lazy(() => parse.int(context.scope.fallback ?? ''));
        const count = parse.int(countStr, false) ?? fallback.value;
        if (isNaN(count))
            throw new NotANumberError(countStr);

        if (chars.length === 0)
            throw new BBTagRuntimeError('Not enough characters');

        const numberArray = [...Array(count).keys()];
        return numberArray.map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
}
