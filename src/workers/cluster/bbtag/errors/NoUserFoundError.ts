import { BBTagRuntimeError } from './BBTagRuntimeError';

export class NoUserFoundError extends BBTagRuntimeError {
    public constructor(
        public readonly value: JToken
    ) {
        super('No user found', `${JSON.stringify(value)} could not be resolved to a user`);
    }
}
