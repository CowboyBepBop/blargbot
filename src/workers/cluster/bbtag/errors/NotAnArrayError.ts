import { BBTagRuntimeError } from './BBTagRuntimeError';

export class NotAnArrayError extends BBTagRuntimeError {
    public constructor(
        public readonly value: JToken
    ) {
        super('Not an array', `${JSON.stringify(value)} could not be understood as an array`);
    }
}
