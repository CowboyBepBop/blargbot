import { BBTagRuntimeError } from './BBTagRuntimeError';

export class InvalidEmbedError extends BBTagRuntimeError {
    public constructor(
        public readonly reason: string,
        public readonly value?: unknown
    ) {
        super(`Invalid embed: ${reason}`, value === undefined ? undefined : `Value: ${JSON.stringify(value)}`);
    }
}
