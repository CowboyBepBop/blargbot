import { BBTagRuntimeError } from './BBTagRuntimeError';

export class NoMessageFoundError extends BBTagRuntimeError {
    public constructor(
        public readonly value: JToken
    ) {
        super('No message found', `${JSON.stringify(value)} could not be resolved to a message`);
    }
}
