import { BBTagContext, RegexSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RegexReplaceSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regexreplace',
            category: SubtagType.COMPLEX,
            desc: 'Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. ' +
                '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
                '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.',
            definition: [
                {
                    parameters: ['~regex', 'replaceWith'],
                    description: 'Replaces the `regex` phrase with `replacewith`. This is executed on the output of the containing tag.',
                    exampleCode: 'I like to eat cheese. {regexreplace;/cheese/;pie}',
                    exampleOut: 'I like to eat pie.',
                    execute: (ctx, [regex, replaceWith]) => this.setDeferredReplace(ctx, regex.raw, replaceWith.value)
                },
                {
                    type: 'constant',
                    parameters: ['text', '~regex', 'replaceWith'],
                    description: 'Replace the `regex` phrase with `replaceWith`. This is executed on `text`.',
                    exampleCode: 'I like {regexreplace;to consume;/o/gi;a} cheese. {regexreplace;/e/gi;n}',
                    exampleOut: 'I likn ta cansumn chnnsn.',
                    execute: (_, [text, regex, replaceWith]) => this.replace(text.value, regex.raw, replaceWith.value)
                }
            ]
        });
    }

    public setDeferredReplace(context: BBTagContext, pattern: string, replacement: string): undefined {
        context.state.replace = {
            regex: this.parseRegex(pattern),
            with: replacement
        };
        return undefined;
    }

    public replace(text: string, regexStr: string, replaceWith: string): string {
        return text.replace(this.parseRegex(regexStr), replaceWith);
    }
}
