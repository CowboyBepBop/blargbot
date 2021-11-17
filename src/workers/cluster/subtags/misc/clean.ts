import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class CleanSubtag extends Subtag {
    public constructor() {
        super({
            name: 'clean',
            category: SubtagType.MISC
        });
    }

    @Subtag.signature('string', [
        Subtag.argument('text', 'string')
    ], {
        description: 'Removes all duplicated whitespace from `text`, meaning a cleaner output.',
        exampleCode: '{clean;Hello!  \n\n  Im     here    to help}',
        exampleOut: 'Hello!\nIm here to help'
    })
    public clean(text: string): string {
        return text.replace(/\s+/g, (match) => {
            if (match.includes('\n')) return '\n';
            if (match.includes('\t')) return '\t';
            return match.substr(0, 1);
        });
    }
}
