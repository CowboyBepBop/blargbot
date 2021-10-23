import { BBTagRuntimeError } from './BBTagRuntimeError';

export class NotANumberError extends BBTagRuntimeError {
    public constructor(
        public readonly value: JToken,
        public readonly type: 'integer' | 'number' = 'number'
    ) {
        super('Not a number', `${JSON.stringify(value)} could not be understood as ${type === 'integer' ? 'an' : 'a'} ${type}`);
    }
}
