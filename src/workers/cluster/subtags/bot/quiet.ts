import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class QuietSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'quiet',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['isQuiet?:true'],
                    description: 'Tells any subtags that rely on a `quiet` field to be/not be quiet based on `isQuiet. `isQuiet` must be a boolean',
                    exampleCode: '{quiet} {usermention;cat}',
                    exampleOut: 'cat',
                    execute: (ctx, [quiet]) => this.setQuiet(ctx, quiet.value)
                }
            ]
        });
    }

    public setQuiet(context: BBTagContext, quietStr: string): undefined {
        context.scope.quiet = parse.boolean(quietStr);
        return undefined;
    }
}
