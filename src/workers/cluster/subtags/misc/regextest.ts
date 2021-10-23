import { RegexSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RegexTestSubtag extends RegexSubtag {
    public constructor() {
        super({
            name: 'regextest',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['text', '~regex'],
                    description: 'Tests if the `regex` phrase matches the `text`, and returns a boolean (true/false). Any bbtag in `regex` will not be resolved. Please consider using `{apply}` for a dynamic regex. ' +
                        '`regex` will only succeed to compile if it is deemed a safe regular expression ' +
                        '(safe regexes do not run in exponential time for any input) and is less than 2000 characters long.',
                    exampleCode: '{regextest;apple;/p+/i} {regextest;banana;/p+/i}',
                    exampleOut: 'true false',
                    execute: (_, [text, regex]) => this.regexTest(text.value, regex.value)
                }
            ]
        });
    }

    public regexTest(value: string, pattern: string): boolean {
        return this.parseRegex(pattern).test(value);
    }
}
