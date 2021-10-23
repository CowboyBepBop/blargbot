import { BBTagRuntimeError } from './BBTagRuntimeError';

export class TooManyLoopsError extends BBTagRuntimeError {
    public constructor(
        public readonly maxLoops: number
    ) {
        super('Too many loops', `You have exceeded the limit of ${maxLoops} loops`);
    }
}
