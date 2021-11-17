import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class LangSubtag extends Subtag {
    public constructor() {
        super({
            name: 'lang',
            category: SubtagType.LANG,
            deprecated: true,
            hidden: true
        });
    }

    @Subtag.signature('nothing', [], {
        description: 'Specifies which `language` should be used when viewing the raw of this tag',
        exampleCode: 'This will be displayed with js! {lang;js}.',
        exampleOut: 'This will be displayed with js!.'
    })
    public godIHateThisSubtag(): void {
        /* NOOP */
    }
}
