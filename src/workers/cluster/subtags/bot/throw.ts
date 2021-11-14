import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class ThrowSubtag extends Subtag {
    public constructor() {
        super({
            name: 'throw',
            category: SubtagType.BOT
        });
    }

    @Subtag.signature('error', [
        Subtag.argument('error', 'string', { ifOmitted: 'A custom error occurred' })
    ], {
        description: 'Throws `error`.',
        exampleCode: '{throw;Custom Error}',
        exampleOut: '\u200B`Custom Error`\u200B'
    })
    public throwError(message: string): never {
        throw new BBTagRuntimeError(message, 'A user defined error');
    }
}
