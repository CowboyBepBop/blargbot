import { createSafeRegExp } from '@core/utils';

import { BaseSubtag } from './BaseSubtag';
import { BBTagRuntimeError } from './errors';

export abstract class RegexSubtag extends BaseSubtag {
    protected parseRegex(pattern: string): RegExp {
        try {
            const regexResult = createSafeRegExp(pattern);
            if (regexResult.success)
                return regexResult.regex;

            switch (regexResult.reason) {
                case 'invalid': throw new BBTagRuntimeError('Invalid Regex');
                case 'tooLong': throw new BBTagRuntimeError('Regex too long');
                case 'unsafe': throw new BBTagRuntimeError('Unsafe Regex');
            }
        } catch (e: unknown) {
            if (e instanceof Error)
                throw new BBTagRuntimeError(e.message);
            throw e;
        }
    }
}
