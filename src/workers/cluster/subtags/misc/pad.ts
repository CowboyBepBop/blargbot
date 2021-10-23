import { BaseSubtag, BBTagRuntimeError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class PadSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'pad',
            category: SubtagType.COMPLEX,
            deprecated: 'realpad',
            definition: [
                {
                    type: 'constant',
                    parameters: ['direction', 'back', 'text'],
                    description: 'Places `text` ontop of `back` with it being aligned to the opposite of `direction`. If `text` is longer than `back` then it will simply overlap',
                    exampleCode: '{pad;left;000000;ABC}',
                    exampleOut: '000ABC',
                    execute: (_, [direction, back, text]) => this.pad(direction.value, back.value, text.value)
                }
            ]
        });
    }

    public pad(direction: string, backing: string, overlay: string): string {
        switch (direction.toLowerCase()) {
            case 'left': return backing.substr(0, backing.length - overlay.length) + overlay;
            case 'right': return overlay + backing.substr(overlay.length);
            default: throw new BBTagRuntimeError('Invalid direction');
        }
    }
}
