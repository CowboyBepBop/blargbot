import { BaseSubtag, BBTagContext, NotANumberError } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class IndexOfSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'indexof',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['text|array', 'searchfor', 'start?:0'],
                    description: 'Finds the index of `searchfor` in `text|array`, after `start`. `text|array` can either be plain text or an array. If it\'s not found, returns -1.',
                    exampleCode: 'The index of "o" in "hello world" is {indexof;hello world;o}',
                    exampleOut: 'The index of "o" in "hello world" is 4',
                    execute: (ctx, [text, searchFor, start]) => this.indexOf(ctx, text.value, searchFor.value, start.value)
                }
            ]
        });
    }

    public indexOf(context: BBTagContext, text: string, query: string, startStr: string): number {
        const { v: array } = bbtagUtil.tagArray.deserialize(text) ?? {};
        const fallback = new Lazy(() => parse.int(context.scope.fallback ?? ''));
        const from = parse.int(startStr, false) ?? fallback.value;

        if (isNaN(from))
            throw new NotANumberError(startStr);

        const input = array ?? text;
        return input.indexOf(query, from);
    }
}
