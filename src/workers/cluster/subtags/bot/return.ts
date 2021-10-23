import { BaseSubtag, ReturnError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class ReturnSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'return',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['force?:true'],
                    description: 'Stops execution of the tag and returns what has been parsed. ' +
                        'If `force` is `true` then it will also return from any tags calling this tag.',
                    exampleCode: 'This will display. {return} This will not.',
                    exampleOut: 'This will display.',
                    execute: (_, [forced]) => this.setReturn(forced.value)
                }
            ]
        });
    }
    public setReturn(forcedStr: string): never {
        const root = parse.boolean(forcedStr, true);
        throw new ReturnError(root ? 'root' : 'scope');
    }
}
