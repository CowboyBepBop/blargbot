import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class OutputSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'output',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['text?'],
                    description: 'Forces an early send of the default output message, using `text` as the text to show. ' +
                        'If this is used then there will be no output sent once the tag finishes. Only 1 `{output}` may be used per ' +
                        'tag/cc. If a second `{output}` is used then the result of the first `{output}` will be returned instead.' +
                        '\nThe message id of the output that was sent will be returned.',
                    exampleCode: '{output;Hello!}',
                    exampleOut: 'Hello!',
                    execute: (ctx, [text]) => this.sendOutput(ctx, text.value)
                }
            ]
        });
    }

    public async sendOutput(context: BBTagContext, text: string): Promise<string> {
        if (context.state.outputMessage !== undefined && text.length > 0)
            throw new BBTagRuntimeError('Cannot send multiple outputs');
        return await context.sendOutput(text) ?? '';

    }
}
