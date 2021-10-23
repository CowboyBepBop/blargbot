import { BBTagRuntimeError } from './BBTagRuntimeError';

export class ReturnError extends BBTagRuntimeError {
    public constructor(
        terminate: 'scope' | 'root'
    ) {
        super('Returning from the current call site', undefined, terminate);
        this.emit = false;
    }
}
