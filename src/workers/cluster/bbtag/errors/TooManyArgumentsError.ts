import { BBTagRuntimeError } from './BBTagRuntimeError';

export class TooManyArgumentsError extends BBTagRuntimeError {
    public constructor(
        public readonly expectedMaximum: number,
        public readonly actual: number
    ) {
        super('Too many arguments', `Expected ${expectedMaximum} or fewer arguments, but got ${actual}`);
    }
}
