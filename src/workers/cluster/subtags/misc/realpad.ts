import { BaseSubtag, BBTagRuntimeError, NotANumberError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class RealPadSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'realpad',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    type: 'constant',
                    parameters: ['text', 'length'],
                    description: 'Pads `text` using space until it has `length` characters. Spaces are added on the right side.',
                    exampleCode: '{realpad;Hello;10} world!',
                    exampleOut: 'Hello      world!',
                    execute: (_, [text, length]) => this.realPad(text.value, length.value, ' ', 'right')
                },
                {
                    type: 'constant',
                    parameters: ['text', 'length', 'filler', 'direction?:right'],
                    description: 'Pads `text` using `filler` until it has `length` characters. `filler` is applied to the  `direction` of `text`. `filler` defaults to space.',
                    exampleCode: '{realpad;ABC;6;0;left}',
                    exampleOut: '000ABC',
                    execute: (_, [text, length, filler, direction]) => this.realPad(text.value, length.value, filler.value, direction.value.toLowerCase())
                }
            ]
        });
    }

    public realPad(text: string, lengthStr: string, filler: string, direction: string): string {
        const length = parse.int(lengthStr);
        if (filler === '')
            filler = ' ';

        if (direction !== 'right' && direction !== 'left')
            throw new BBTagRuntimeError('Invalid direction', direction + 'is invalid');

        if (isNaN(length))
            throw new NotANumberError(lengthStr);

        if (filler.length !== 1)
            throw new BBTagRuntimeError('Filler must be 1 character');

        const padAmount = Math.max(0, length - text.length);

        if (direction === 'right')
            return text + filler.repeat(padAmount);
        return filler.repeat(padAmount) + text;
    }
}
