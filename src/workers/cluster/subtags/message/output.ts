import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class OutputSubtag extends Subtag {
    public constructor() {
        super({
            name: 'output',
            category: SubtagType.MESSAGE
        });
    }

    @Subtag.signature('snowflake?', [
        Subtag.context(),
        Subtag.argument('text', 'string').allowOmitted()
    ], {
        description: 'Forces an early send of the default output message, using `text` as the text to show. ' +
            'If this is used then there will be no output sent once the tag finishes. Only 1 `{output}` may be used per ' +
            'tag/cc. If a second `{output}` is used then the result of the first `{output}` will be returned instead.' +
            '\nThe message id of the message that was sent will be returned.',
        exampleCode: '{output;Hello!}',
        exampleOut: 'Hello!'
    })
    public async sendTagOutput(context: BBTagContext, text?: string): Promise<string | undefined> {
        if (context.state.outputMessage !== undefined && text !== undefined)
            throw new BBTagRuntimeError('Cannot send multiple outputs');
        return await context.sendOutput(text);
    }
}
