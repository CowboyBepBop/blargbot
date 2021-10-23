import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ReplaceSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'replace',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['phrase', 'replaceWith'],
                    description: 'Replaces the first occurence of `phrase` with `replaceWith`. This is executed on the output from the containing tag.',
                    exampleCode: 'Hello world! {replace;Hello;Bye}',
                    exampleOut: 'Bye world!',
                    execute: (ctx, [phrase, replaceWith]) => this.setDeferredReplace(ctx, phrase.value, replaceWith.value)
                },
                {
                    type: 'constant',
                    parameters: ['text', 'phrase', 'replaceWith'],
                    description: 'Replaces the first occurence of `phrase` in `text` with `replaceWith`.',
                    exampleCode: 'I like {replace;to eat;eat;nom} cheese. {replace;cheese;ham}',
                    exampleOut: 'I like to nom ham. ham',
                    execute: (_, [text, phrase, replaceWith]) => this.replace(text.value, phrase.value, replaceWith.value)
                }
            ]
        });
    }

    public setDeferredReplace(context: BBTagContext, pattern: string, replacement: string): undefined {
        context.state.replace = {
            regex: pattern,
            with: replacement
        };
        return undefined;
    }

    public replace(text: string, pattern: string, replacement: string): string {
        return text.replace(pattern, replacement);
    }
}
