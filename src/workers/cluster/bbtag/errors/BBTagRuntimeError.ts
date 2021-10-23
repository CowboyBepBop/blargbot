export class BBTagRuntimeError extends Error {
    public constructor(
        public readonly message: string,
        public readonly detail?: string
    ) {
        super(message);
    }
}
