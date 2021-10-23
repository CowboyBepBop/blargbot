import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

const json = bbtagUtil.json;

export class JsonGetSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonget',
            category: SubtagType.JSON,
            aliases: ['jget'],
            definition: [
                {
                    parameters: ['input:{}', 'path?'],
                    description: 'Navigates the path of a JSON object. Works with arrays too!\n' +
                        '`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
                        '`path` is a dot-noted series of properties.',
                    exampleCode: '{jsonget;{j;{\n  "array": [\n    "zero",\n    { "value": "one" },\n    "two"\n  ]\n}};array.1.value}',
                    exampleOut: 'one',
                    execute: (ctx, [input, path]) => this.getJson(ctx, input.value, path.value)
                }
            ]
        });
    }

    public async getJson(context: BBTagContext, objectStr: string, path: string): Promise<JToken> {
        const { v: object } = await bbtagUtil.tagArray.resolve(context, objectStr)
            ?? { v: (await json.parse(context, objectStr)).object };

        try {
            return json.get(object, path);
        } catch (err: unknown) {
            if (err instanceof Error)
                throw new BBTagRuntimeError(err.message);
            throw err;
        }
    }
}
