import { BaseSubtag, BBTagRuntimeError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { default as Brainfuck } from 'brainfuck-node';

export class BrainFuckSubtag extends BaseSubtag {
    private readonly client: Brainfuck;

    public constructor() {
        super({
            name: 'brainfuck',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['code', 'input?'],
                    description: 'Interprets `code` as brainfuck, using `input` as the text for `,`.',
                    exampleCode: '{brainfuck;++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.}',
                    exampleOut: 'Hello World!',
                    execute: (_, [code, input]) => this.brainfuck(code.value, input.value)
                }
            ]
        });
        this.client = new Brainfuck();
    }

    public brainfuck(code: string, input: string): string {
        try {
            return this.client.execute(code, input).output;
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw new BBTagRuntimeError('Unexpected error from brainfuck');
        }
    }
}
