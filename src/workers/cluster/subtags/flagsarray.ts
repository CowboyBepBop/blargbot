import { BaseSubtag, SubtagType } from '../core';

export class FlagsArraySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'flagsarray',
            category: SubtagType.BOT,
            desc: 'Returns an array of all flags provided.',
            definition: [
                {
                    parameters: [],
                    exampleCode: '{flagsarray}',
                    exampleIn: 'Hello -dc world',
                    exampleOut: '["_","d","c"]',
                    execute: (ctx) => JSON.stringify(Object.keys(ctx.flaggedInput).filter(key => key !== 'undefined'))
                }
            ]
        });
    }
}