import { BaseSubtag, BBTagContext, BBTagRuntimeError, NotANumberError } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class RepeatSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'repeat',
            category: SubtagType.LOOPS,
            aliases: ['loop'],
            definition: [
                {
                    parameters: ['~code', 'amount'],
                    description: 'Repeatedly executes `code` `amount` times.',
                    exampleCode: '{repeat;e;10}',
                    exampleOut: 'eeeeeeeeee',
                    execute: (ctx, [code, amount]) => this.repeat(ctx, code, amount.value)
                }
            ]
        });
    }

    public async * repeat(context: BBTagContext, code: SubtagArgumentValue, amountStr: string): AsyncGenerator<string> {
        const fallback = new Lazy(() => parse.int(context.scope.fallback ?? ''));
        const amount = parse.int(amountStr, false) ?? fallback.value;

        if (isNaN(amount))
            throw new NotANumberError(amountStr);

        if (amount < 0)
            throw new BBTagRuntimeError('Can\'t be negative');

        for (let i = 0; i < amount; i++) {
            await context.limit.check(context, 'repeat:loops');
            yield await code.execute();
        }
    }
}
