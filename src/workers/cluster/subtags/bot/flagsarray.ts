import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { FlagResult } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class FlagsArraySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'flagsarray',
            category: SubtagType.BOT,
            desc: 'Returns an array of all flags provided.',
            definition: [
                {
                    type: 'constant',
                    parameters: [],
                    exampleCode: '{flagsarray}',
                    exampleIn: 'Hello -dc world',
                    exampleOut: '["_","d","c"]',
                    execute: (ctx) => this.flagKeys(ctx)
                }
            ]
        });
    }

    public flagKeys(context: BBTagContext): Array<keyof FlagResult> {
        return Object.keys(context.flaggedInput);
    }
}
