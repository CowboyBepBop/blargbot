import { BaseSubtag, BBTagContext, NotABooleanError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class SuppressLookupSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'suppresslookup',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['value?'],
                    description: 'Sets whether error messages in the lookup system (query canceled, nothing found) should be suppressed. `value` must be a boolean, and defaults to `true`.',
                    exampleCode: '{suppresslookup}',
                    exampleOut: '',
                    execute: (ctx, [value]) => this.suppress(ctx, value.value)
                }
            ]
        });
    }

    public suppress(context: BBTagContext, value: string): undefined {
        let suppress: boolean | undefined = true;
        if (value !== '') {
            suppress = parse.boolean(value);
            if (typeof suppress !== 'boolean')
                throw new NotABooleanError(value);
        }

        context.scope.noLookupErrors = suppress;
        return undefined;
    }
}
