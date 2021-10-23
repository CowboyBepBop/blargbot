import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { BBTagASTCall } from '@cluster/types';
import { bbtagUtil, guard, SubtagType } from '@cluster/utils';

export class ApplySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'apply',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['subtag', 'args*'],
                    description:
                        'Executes `subtag`, using the `args` as parameters. ' +
                        'If `args` is an array, it will get deconstructed to it\'s individual elements.',
                    exampleCode: '{apply;randint;[1,4]}',
                    exampleOut: '3',
                    execute: (ctx, [subtagName, ...args], subtag) => this.defaultApply(ctx, subtagName.value, args.map(a => a.value), subtag)
                }
            ]
        });
    }

    public async defaultApply(
        context: BBTagContext,
        subtagName: string,
        args: string[],
        subtag: BBTagASTCall
    ): Promise<string> {
        const subtagType = context.subtags.get(subtagName);
        if (subtagType === undefined)
            throw new BBTagRuntimeError('No subtag found');

        const flattenedArgs: string[][] = [];

        for (const arg of args) {
            const arr = bbtagUtil.tagArray.deserialize(arg);
            if (arr !== undefined && Array.isArray(arr.v))
                flattenedArgs.push(
                    ...arr.v.map((i) =>
                        typeof i === 'object' || !guard.hasValue(i)
                            ? [JSON.stringify(i)]
                            : [i.toString()]
                    )
                );
            else flattenedArgs.push([arg]);
        }
        const plan = bbtagUtil.buildExecutionPlan(context, [
            {
                args: flattenedArgs,
                end: subtag.end,
                source: `{${flattenedArgs.join(';')}}`,
                name: [subtagName],
                start: subtag.start
            }
        ]);
        return await context.eval(plan);
    }
}
