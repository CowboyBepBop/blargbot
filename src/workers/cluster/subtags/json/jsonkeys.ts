import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class JsonKeysSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonkeys',
            category: SubtagType.JSON,
            aliases: ['jkeys'],
            definition: [
                {
                    parameters: ['object', 'path?'],
                    description: 'Retrieves all keys from provided the JSON object. ' +
                        '`object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
                        '`path` is a dot-noted series of properties.',
                    exampleCode: '{set;~json;{json;{"key": "value", "key2" : "value2"}}\n' +
                        '{jsonkeys;~json}',
                    exampleOut: '["key","key2"]',
                    execute: (ctx, [object, path]) => this.getJsonKeys(ctx, object.value, path.value)
                }
            ]
        });
    }

    public async getJsonKeys(context: BBTagContext, objectStr: string, path: string): Promise<string[]> {
        const { v: obj } = await bbtagUtil.tagArray.resolve(context, objectStr)
            ?? { v: (await bbtagUtil.json.parse(context, objectStr)).object };

        try {
            if (path === '')
                return Object.keys(obj);

            const objAtPath = bbtagUtil.json.get(obj, path);
            return Object.keys(objAtPath ?? {});
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw e;
        }
    }
}
