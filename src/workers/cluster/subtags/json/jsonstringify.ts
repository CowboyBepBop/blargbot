import { BaseSubtag, BBTagContext, NotANumberError } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class JsonStringifySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'jsonstringify',
            category: SubtagType.JSON,
            aliases: ['jstringify'],
            definition: [
                {
                    parameters: ['input:{}', 'indent?:4'],
                    description: 'Pretty-prints the provided JSON `input` with the provided `indent`.',
                    exampleCode: '{jsonstringify;["one","two","three"]}',
                    exampleOut: '[\n    "one",\n    "two",\n    "three"\n]',
                    execute: (ctx, [input, indent]) => this.jsonStringify(ctx, input.value, indent.value)
                }
            ]
        });
    }

    public async jsonStringify(context: BBTagContext, valueStr: string, indentStr: string): Promise<string> {
        const indent = parse.int(indentStr);
        if (isNaN(indent))
            throw new NotANumberError(indentStr);

        const { v: obj } = await bbtagUtil.tagArray.resolve(context, valueStr)
            ?? { v: (await bbtagUtil.json.parse(context, valueStr)).object };

        return JSON.stringify(obj, null, indent);
    }
}
