import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class FallBackSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'fallback',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['message?'],
                    description: 'Should any tag fail to parse, it will be replaced with `message` instead of an error.',
                    exampleCode: '{fallback;This tag failed} {randint}',
                    exampleOut: 'This tag failed',
                    execute: (ctx, [message]) => this.setFallback(ctx, message.value)
                }
            ]
        });
    }

    public setFallback(context: BBTagContext, message: string): undefined {
        context.scope.fallback = message;
        return undefined;
    }
}
