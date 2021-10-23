import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
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
                    execute: (ctx, [forced]) => this.setReturn(ctx, forced.value)
                }
            ]
        });
    }
    public setReturn(context: BBTagContext, forcedStr: string): undefined {
        const forced = parse.boolean(forcedStr, true);
        context.state.return = forced ? -1 : 1;
        return undefined;
    }
}
