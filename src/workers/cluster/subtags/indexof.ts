import { Cluster } from '../Cluster';
import { BaseSubtag, bbtagUtil, parse, SubtagType } from '../core';

export class IndexOfSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'indexof',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text|array', 'searchfor', 'start?:0'],
                    description: 'Finds the index of `searchfor` in `text|array`, after `start`. `text|array` can either be plain text or an array. If it\'s not found, returns -1.',
                    exampleCode: 'The index of "o" in "hello world" is {indexof;hello world;o}',
                    exampleOut: 'The index of "o" in "hello world" is 4',
                    execute: (context, [{ value: text }, { value: query }, { value: start }], subtag) => {
                        const deserializedArray = bbtagUtil.tagArray.deserialize(text),
                            fallback = parse.int(context.scope.fallback ?? '');
                        let from = parse.int(start);

                        if (isNaN(from)) from = fallback;
                        if (isNaN(from)) return this.notANumber(context, subtag, 'Start and fallback are not numbers');

                        let input;
                        if (deserializedArray && Array.isArray(deserializedArray.v))
                            input = deserializedArray.v;
                        else
                            input = text;

                        return input.indexOf(query, from).toString();
                    }
                }
            ]
        });
    }
}