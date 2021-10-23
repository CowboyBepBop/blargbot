import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class JsonValuesSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonvalues',
            category: SubtagType.JSON,
            aliases: ['jvalues'],
            definition: [
                {
                    parameters: ['object', 'path?'],
                    description: 'Retrieves all values from provided the JSON object. ' +
                        '`object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
                        '`path` is a dot-noted series of properties.',
                    exampleCode: '{set;~json;{json;{"key": "value", "key2" : "value2"}}\n'
                        + '{jsonvalues;~json}',
                    exampleOut: '["value","value2"]',
                    execute: (ctx, [object, path]) => this.getJsonValues(ctx, object.value, path.value)
                }
            ]
        });
    }

    public async getJsonValues(context: BBTagContext, objectStr: string, path: string): Promise<JArray | undefined> {
        const { v: object } = await bbtagUtil.tagArray.resolve(context, objectStr)
            ?? { v: (await bbtagUtil.json.parse(context, objectStr)).object };

        if (path === '')
            return Object.values(object);

        try {
            const objAtPath = bbtagUtil.json.get(object, path);
            if (objAtPath === undefined || objAtPath === null)
                return undefined;

            return Object.values(objAtPath);
        } catch (err: unknown) {
            if (err instanceof Error)
                throw new BBTagRuntimeError(err.message);
            throw err;
        }
    }
}
