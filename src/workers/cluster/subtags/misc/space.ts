import { BaseSubtag, BBTagContext, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class SpaceSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'space',
            category: SubtagType.COMPLEX,
            aliases: ['s'],
            definition: [
                {
                    type: 'constant',
                    parameters: ['count?:1'],
                    description: 'Will be replaced by `count` spaces. If `count` is less than `0`, no spaces will be returned.',
                    exampleCode: 'Hello,{space;4}world!',
                    exampleOut: 'Hello,    world!',
                    execute: (ctx, [count]) => this.space(ctx, count.value)
                }
            ]
        });
    }

    public space(context: BBTagContext, countStr: string): string {
        let count = parse.int(countStr, false) ?? parse.int(context.scope.fallback ?? '');
        if (isNaN(count))
            throw new NotANumberError(countStr);

        if (count < 0)
            count = 0;

        return ''.padStart(count, ' ');
    }
}
