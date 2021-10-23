import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagASTCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class DebugSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'debug',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text?'],
                    description: 'Adds the specified text to the debug output. This output is only shown via ' +
                        '`tag debug`, `ccommand debug`, `tag test debug` and `ccommand test debug`.' +
                        'The line number is also included in the debug entry',
                    exampleCode: '{debug;current value;{get;~i}}',
                    exampleOut: '(in debug output)[10]current value 1',
                    execute: (ctx, [text], subtag) => this.addDebug(ctx, text.value, subtag)
                }
            ]
        });
    }

    public addDebug(context: BBTagContext, text: string, subtag: BBTagASTCall): undefined {
        context.addError('', subtag, text);
        return undefined;
    }
}
