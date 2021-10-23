import { BaseSubtag, BBTagContext, BBTagRuntimeError, NotANumberError, tagVariableScopes } from '@cluster/bbtag';
import { BBTagArray } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';

export class GetSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'get',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['name'],
                    description: 'Returns the stored variable `varName`.\n' +
                        'You can use a character prefix to determine the scope of your variable.\n' +
                        'Valid scopes are: ' + tagVariableScopes.map((s) => `${s.prefix.length === 0 ? 'no prefix' : `\`${s.prefix}\``} (${s.name})`).join(', ') +
                        '. For more information, use `b!t docs variable` or `b!cc docs variable`',
                    exampleCode: '{set;var1;This is local var1}\n{set;~var2;This is temporary var2}\n{get;var1}\n{get;~var2}',
                    exampleOut: 'This is local var1\nThis is temporary var2',
                    execute: async (ctx, [varName]) => await this.get(ctx, varName.value)
                },
                {
                    parameters: ['name', 'index'],
                    description: 'When variable `name` is an array this will return the element at index `index`.' +
                        ' If `index` is empty the entire array will be returned. If variable is not an array it will return the whole variable.',
                    execute: async (ctx, [varName, index]) => await this.getArray(ctx, varName.value, index.value)
                }
            ]
        });
    }

    public async get(context: BBTagContext, variableName: string): Promise<BBTagArray | JToken> {
        const value = await context.variables.get(variableName);
        if (Array.isArray(value))
            return { n: variableName, v: value };
        return value;
    }

    public async getArray(context: BBTagContext, variableName: string, indexStr: string): Promise<BBTagArray | JToken> {
        const result = await context.variables.get(variableName);
        if (!Array.isArray(result))
            return result;

        if (indexStr === '')
            return result;

        const index = parse.int(indexStr);
        if (isNaN(index))
            throw new NotANumberError(indexStr);

        if (result[index] === undefined)
            throw new BBTagRuntimeError('Index out of range');

        return result[index];
    }
}
