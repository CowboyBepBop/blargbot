import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class ReactionUserSubtag extends Subtag {
    public constructor() {
        super({
            name: 'reactuser',
            category: SubtagType.MESSAGE
        });
    }

    @Subtag.signature('snowflake', [
        Subtag.context()
    ], {
        description: 'Gets the user whos reaction that triggered {waitreact}',
        exampleCode: '{waitreact;11111111111111111;{bool;{reactuser};==;3333333333333}}',
        exampleOut: '["111111111111111","12345678912345","3333333333333","✅"]'
    })
    public getReaction(context: BBTagContext): string {
        const val = context.scopes.local.reactUser;
        if (val === undefined)
            throw new BBTagRuntimeError('{reactuser} can only be used inside {waitreaction}');
        return val;
    }
}
