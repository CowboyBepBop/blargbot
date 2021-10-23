import { BaseSubtag, BBTagRuntimeError, NotANumberError } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';

export class ChooseSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'choose',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['choice', '~options+'],
                    description: 'Chooses from the given `options`, where `choice` is the index of the option to select.',
                    exampleCode: 'I feel like eating {choose;1;cake;pie;pudding} today.',
                    exampleOut: 'I feel like eating pie today.',
                    execute: (_, [choice, ...options]) => this.choose(choice.value, options)
                }
            ]
        });
    }
    public async choose(indexStr: string, options: SubtagArgumentValue[]): Promise<string> {
        const index = parse.int(indexStr);

        if (isNaN(index))
            throw new NotANumberError(indexStr);

        if (index < 0)
            throw new BBTagRuntimeError('Choice cannot be negative');

        if (index >= options.length)
            throw new BBTagRuntimeError('Index out of range');

        return await options[index].wait();
    }
}
