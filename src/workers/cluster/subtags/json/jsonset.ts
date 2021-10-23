import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class JsonSetSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonset',
            category: SubtagType.JSON,
            aliases: ['jset'],
            definition: [
                {
                    parameters: ['input:{}', 'path', 'value', 'create?'],
                    description: 'Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`. ' +
                        '`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.' +
                        'If `create` is not empty, will create/convert any missing keys.',
                    exampleCode: '{jsonset;;path.to.key;value;create}',
                    exampleOut: '{"path":{"to":{"key":"value"}}}',
                    execute: (ctx, [input, path, value, create]) => this.setJson(ctx, input.value, path.value, value.value, create.value)
                }
            ]
        });
    }

    public async setJson(context: BBTagContext, objectStr: string, path: string, value: string, createStr: string): Promise<JObject | JArray | undefined> {
        const create = createStr !== '' ? true : false;
        try {
            const val = await bbtagUtil.tagArray.resolve(context, objectStr) ?? await bbtagUtil.json.parse(context, objectStr);
            const { n: varName, v: object } = 'object' in val ? { n: val.variable, v: val.object } : val;
            const modifiedObj = bbtagUtil.json.set(object, path, value, create);

            if (varName === undefined)
                return modifiedObj;
            await context.variables.set(varName, object);
            return undefined;
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw e;
        }
    }
}
