import { pluralise as p } from '@core/utils';

import { BBTagRuntimeError } from './BBTagRuntimeError';

export class NotEnoughArgumentsError extends BBTagRuntimeError {
    public constructor(
        public readonly expectedMinimum: number,
        public readonly actual: number
    ) {
        super('Not enough arguments', `Expected ${expectedMinimum} or more arguments, but only ${actual} ${p(actual, 'was', 'were')} given`);
    }
}
