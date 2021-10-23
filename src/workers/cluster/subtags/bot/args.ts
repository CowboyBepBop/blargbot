import { BaseSubtag, BBTagContext, NotANumberError, NotEnoughArgumentsError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class ArgsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'args',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    description: 'Gets the whole user input',
                    exampleCode: 'You said {args}',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'You said Hello world! BBtag is so cool',
                    execute: (ctx) => this.getAllArgs(ctx)
                },
                {
                    type: 'constant',
                    parameters: ['index'],
                    description: 'Gets a word from the user input at the `index` position',
                    exampleCode: '{args;1}',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'world!',
                    execute: (ctx, [index]) => this.getArg(ctx, index.value)
                },
                {
                    type: 'constant',
                    parameters: ['start', 'end'],
                    description: 'Gets all the words in the user input from `start` up to `end`. If `end` is `n` then all words after `start` will be returned',
                    exampleCode: '{args;2;4}',
                    exampleIn: 'Hello world! BBtag is so cool',
                    exampleOut: 'BBtag is',
                    execute: (ctx, [start, end]) => this.getArgs(ctx, start.value, end.value)
                }
            ]
        });
    }

    public getAllArgs(context: BBTagContext): string {
        return context.input.join(' ');
    }

    public getArg(context: BBTagContext, index: string): string {
        const i = parse.int(index);
        if (isNaN(i))
            throw new NotANumberError(index);

        return context.input[i];
    }

    public getArgs(context: BBTagContext, start: string, end: string): string {
        let from = parse.int(start);
        if (isNaN(from))
            throw new NotANumberError(start);

        let to = end.toLowerCase() === 'n'
            ? context.input.length
            : parse.int(end);

        if (isNaN(to))
            throw new NotANumberError(end);

        // TODO This behaviour should be documented
        if (from > to)
            from = [to, to = from][0];

        if (context.input.length >= from || from < 0)
            throw new NotEnoughArgumentsError(from, context.input.length);

        return context.input.slice(from, to).join(' ');
    }
}
