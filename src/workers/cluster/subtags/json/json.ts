import { BaseSubtag, BBTagRuntimeError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class JsonSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'json',
            category: SubtagType.JSON,
            aliases: ['j'],
            definition: [{
                type: 'constant',
                parameters: ['~input?:{}'],
                description: 'Defines a raw JSON object. Usage of subtags is disabled in `input`, inside `input` all brackets are required to match.',
                exampleCode: '{json;{\n  "key": "value"\n}}',
                exampleOut: '{\n  "key": "value"\n}',
                execute: (_, [value]) => this.getJson(value.raw)
            }]
        });
    }

    public getJson(input: string): JToken {
        try {
            return JSON.parse(input);
        } catch (err: unknown) {
            throw new BBTagRuntimeError('Invalid JSON provided');
        }
    }
}
