import { BBTagRuntimeError } from './BBTagRuntimeError';

export class ArgLengthExceededError extends BBTagRuntimeError {
    public constructor(
        public readonly maxLength: number,
        public readonly argIndex: number,
        public readonly actualLength: number
    ) {
        super('Argument length exceeded limit', `Argument ${argIndex} is limited to ${maxLength} but got a value of length ${actualLength}`);
    }
}
