import { BaseSubtag, BBTagContext, BBTagRuntimeError, NotANumberError } from '@cluster/bbtag';
import { between, parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class BaseNumberSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'base',
            aliases: ['radix'],
            category: SubtagType.MATH,
            definition: [
                {
                    type: 'constant',
                    parameters: ['integer', 'origin?:10', 'radix'],
                    description: 'Converts `integer` from a base `origin` number into a base `radix` number. `radix` and `origin` must be between 2 and 36.',
                    exampleCode: '{base;FF;16;10}',
                    exampleOut: '255',
                    execute: (ctx, [integer, origin, radix]) => this.toBase(ctx, integer.value, origin.value, radix.value)
                }
            ]
        });
    }

    public toBase(context: BBTagContext, valueStr: string, originStr: string, radixStr: string): string {
        const fallback = new Lazy(() => parse.int(context.scope.fallback ?? ''));

        const origin = parse.int(originStr, false) ?? fallback.value;
        if (isNaN(origin))
            throw new NotANumberError(originStr);
        if (!between(origin, 2, 36, true))
            throw new BBTagRuntimeError('Base must be between 2 and 36', origin.toString());

        const radix = parse.int(radixStr, false) ?? fallback.value;
        if (isNaN(radix))
            throw new NotANumberError(radixStr);
        if (!between(radix, 2, 36, true))
            throw new BBTagRuntimeError('Base must be between 2 and 36', radix.toString());

        const value = parse.int(valueStr, false, origin) ?? fallback.value;
        if (isNaN(value))
            throw new NotANumberError(valueStr);
        return value.toString(radix);
    }
}
