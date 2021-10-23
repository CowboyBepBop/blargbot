import { BaseSubtag, BBTagContext, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class SubstringSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'substring',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['text', 'start', 'end?'],
                    description: 'Returns all text from `text` between the `start` and `end`. ' +
                        '`end` defaults to the length of text.',
                    exampleCode: 'Hello {substring;world;2;3}!',
                    exampleOut: 'Hello r!',
                    execute: (ctx, [text, start, end]) => this.substring(ctx, text.value, start.value, end.value)
                }
            ]
        });
    }

    public substring(context: BBTagContext, text: string, startStr: string, endStr: string): string {
        const fallback = new Lazy(() => parse.int(context.scope.fallback ?? ''));
        const start = parse.int(startStr, false) ?? fallback.value;
        if (isNaN(start))
            throw new NotANumberError(startStr, 'integer');

        const end = parse.int(endStr === '' ? text.length : endStr, false) ?? fallback.value;
        if (isNaN(end))
            throw new NotANumberError(endStr, 'integer');

        return text.substring(start, end);
    }
}
