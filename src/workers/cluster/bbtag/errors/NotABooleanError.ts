import { BBTagRuntimeError } from './BBTagRuntimeError';

export class NotABooleanError extends BBTagRuntimeError {
    public constructor(
        public readonly value: JToken
    ) {
        super('Not a boolean', `${JSON.stringify(value)} could not be understood as a boolean`);
    }
}
