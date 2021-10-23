import { BBTagRuntimeError } from './BBTagRuntimeError';

export class ChannelNotFoundError extends BBTagRuntimeError {
    public constructor(
        public readonly value: JToken
    ) {
        super('No channel found', `${JSON.stringify(value)} could not be resolved to a channel`);
    }
}
