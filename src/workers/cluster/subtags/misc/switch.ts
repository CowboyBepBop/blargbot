import { BaseSubtag } from '@cluster/bbtag';
import { SubtagArgumentValue } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { IterTools } from '@core/utils/iterTools';

export class SwitchSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'switch',
            category: SubtagType.COMPLEX,
            definition: [//! Docs overidden
                {
                    parameters: ['value', ['case', '~then'], '~default?'],
                    execute: (_, [value, ...cases]) => {
                        const evenLength = cases.length - cases.length % 2;
                        return this.switch(
                            value.value,
                            IterTools.from(cases)
                                .take(evenLength)
                                .buffer(2)
                                .map(buf => [buf[0].value, buf[1]]),
                            cases[evenLength + 1]
                        );
                    }
                }
            ]
        });
    }

    public async switch(
        value: string,
        cases: Iterable<[string, SubtagArgumentValue]>,
        defaultCase?: SubtagArgumentValue
    ): Promise<string | undefined> {
        for (const [caseValue, then] of cases) {
            if (caseValue === value)
                return then.execute();

            const { v: array } = bbtagUtil.tagArray.deserialize(caseValue) ?? {};
            if (array === undefined)
                continue;

            if (IterTools.from(array).map(i => parse.string(i)).contains(value))
                return await then.execute();
        }
        return defaultCase?.execute();
    }
}
