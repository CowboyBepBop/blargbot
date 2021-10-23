import { RegexSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RegexSplitSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regexsplit',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['text', '~regex'],
                    description: 'Splits the given text using the given `regex` as the split rule. Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. ' +
                        '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
                        '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.',
                    exampleCode: '{regexsplit;Hello      there, I       am hungry;/[\\s,]+/}',
                    exampleOut: '["Hello","there","I","am","hungry"]',
                    execute: (_, [text, regex]) => this.regexSplit(text.value, regex.value)
                }
            ]
        });
    }

    public regexSplit(value: string, pattern: string): string[] {
        return value.split(this.parseRegex(pattern));
    }
}
