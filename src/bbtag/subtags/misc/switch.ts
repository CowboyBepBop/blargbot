import { parse } from '@blargbot/core/utils';

import { SubtagArgument } from '../../arguments';
import { CompiledSubtag } from '../../compilation';
import { bbtag, SubtagType } from '../../utils';

export class SwitchSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'switch',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['value', { repeat: ['case', '~then'], minCount: 1 }, '~default?'],
                    returns: 'string',
                    execute: (_, [value, ...cases]) => this.switch(value.value, ...splitArgs(cases))
                }
            ]
        });
    }

    public async switch(
        value: string,
        cases: ReadonlyArray<readonly [string, SubtagArgument]>,
        defaultCase?: SubtagArgument
    ): Promise<string> {
        for (const [caseValue, then] of cases) {
            const { v: options = [caseValue] } = bbtag.tagArray.deserialize(caseValue) ?? {};
            for (const option of options)
                if (parse.string(option) === value)
                    return await then.execute();
        }
        return await defaultCase?.execute() ?? '';
    }
}

function splitArgs(args: SubtagArgument[]): [cases: ReadonlyArray<readonly [string, SubtagArgument]>, defaultCase?: SubtagArgument] {
    let defaultCase = undefined;
    if (args.length % 2 === 1)
        defaultCase = args.pop();

    const cases = [];
    for (let i = 0; i < args.length; i += 2)
        cases.push([args[i].value, args[i + 1]] as const);
    return [cases, defaultCase];
}
