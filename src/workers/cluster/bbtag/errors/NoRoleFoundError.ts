import { BBTagRuntimeError } from './BBTagRuntimeError';

export class NoRoleFoundError extends BBTagRuntimeError {
    public constructor(
        public readonly value: JToken
    ) {
        super('No role found', `${JSON.stringify(value)} could not be resolved to a role`);
    }
}
