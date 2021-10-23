import { BaseSubtag, BBTagContext, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class NewlineSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'newline',
            category: SubtagType.COMPLEX,
            aliases: ['n'],
            definition: [
                {
                    type: 'constant',
                    parameters: ['count?:1'],
                    description: 'Will be replaced by `count` newline characters (\\n).',
                    exampleCode: 'Hello,{newline}world!',
                    exampleOut: 'Hello,\nworld!',
                    execute: (ctx, [countStr]) => this.newline(ctx, countStr.value)
                }
            ]
        });
    }

    public newline(context: BBTagContext, countStr: string): string {
        const fallback = new Lazy(() => parse.int(context.scope.fallback ?? ''));
        let count = parse.int(countStr, false) ?? fallback.value;

        if (isNaN(count))
            throw new NotANumberError(countStr);

        if (count < 0)
            count = 0;

        return ''.padStart(count, '\n');
    }
}
