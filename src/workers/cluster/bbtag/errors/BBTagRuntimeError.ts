export class BBTagRuntimeError extends Error {
    public emit = true;

    public constructor(
        public readonly message: string,
        public readonly detail?: string,
        public readonly terminate?: 'scope' | 'root'
    ) {
        super(message);
    }
}
