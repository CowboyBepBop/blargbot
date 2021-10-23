import { BaseSubtag, BBTagRuntimeError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ThrowSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'throw',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['error?:A custom error occurred'],
                    description: 'Throws `error`.',
                    exampleCode: '{throw;Custom Error}',
                    exampleOut: '`Custom Error`',
                    execute: (_, [error]) => {
                        throw new BBTagRuntimeError(error.value);
                    }
                }
            ]
        });
    }
}
