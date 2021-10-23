// import { BaseSubtag, BBTagContext, BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag';
// import { BBTagAST, BBTagASTCall, BBTagContextState, SubtagResult } from '@cluster/types';
// import { fail } from 'assert';
// import { expect } from 'chai';
// import { it } from 'mocha';
// import { instance, mock, when } from 'ts-mockito';

// interface ArgRef {
//     code: BBTagAST;
//     resolveOrder: undefined | string[];
//     value: string;
// }

// interface HandleConfig<AutoMock extends Record<string, unknown>, Details> {
//     arrange?: (context: HandleContext<AutoMock>, details: Details, args: readonly ArgRef[], subtag: BBTagASTCall) => Awaitable<void>;
//     assert?: (context: HandleContext<AutoMock>, details: Details, result: SubtagResult | BBTagRuntimeError, args: readonly ArgRef[], subtag: BBTagASTCall) => Awaitable<void>;
// }

// type TestCases<Details, T extends Record<string, unknown>> = ReadonlyArray<TestCase<Details, T>>;

// type TestCase<Details, T extends Record<string, unknown>> =
//     & { args: ReadonlyArray<string | string[] | undefined>; }
//     & (Details extends undefined ? { details?: Details; } : { details: Details; })
//     & T

// type HandleContext<AutoMock extends Record<string, unknown>> =
//     & {
//         contextMock: BBTagContext;
//         stateMock: BBTagContextState;
//     } & {
//         [P in keyof AutoMock]: AutoMock[P] extends abstract new (...args: infer _) => infer R ? R : Exclude<AutoMock[P], undefined>
//     }

// export function testExecuteNotEnoughArgs<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
//     subtag: BaseSubtag,
//     cases: TestCases<Details, { debugMessage?: string; expectedCount: number; }>,
//     automock?: AutoMock,
//     options?: HandleConfig<AutoMock, Details>
// ): void {
//     testExecuteFail(
//         subtag,
//         cases.map(_case => ({
//             ..._case,
//             error: new NotEnoughArgumentsError(_case.expectedCount, _case.args.length)
//         })),
//         automock,
//         options
//     );
// }

// export function testExecuteTooManyArgs<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
//     subtag: BaseSubtag,
//     cases: TestCases<Details, { debugMessage?: string; expectedCount: number; }>,
//     automock?: AutoMock,
//     options?: HandleConfig<AutoMock, Details>
// ): void {
//     testExecuteFail(
//         subtag,
//         cases.map(_case => ({
//             ..._case,
//             error: new TooManyArgumentsError(_case.expectedCount, _case.args.length)
//         })),
//         automock,
//         options
//     );
// }

// export function testExecuteFail<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
//     subtag: BaseSubtag,
//     cases: TestCases<Details, { error: BBTagRuntimeError; }>,
//     automock?: AutoMock,
//     options?: HandleConfig<AutoMock, Details>
// ): void {
//     for (const testCase of cases) {
//         const newOptions: HandleConfig<AutoMock, Details> = {
//             arrange(ctx, details, args, call) {
//                 options?.arrange?.(ctx, details, args, call);
//             },
//             assert(ctx, details, result, args, call) {
//                 options?.assert?.(ctx, details, result, args, call);
//             }
//         };
//         testExecute(subtag, [{ ...testCase, expected: testCase.error, title: testCase.error.message }], automock, newOptions);
//     }
// }

// export function testExecute<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
//     subtag: BaseSubtag,
//     cases: TestCases<Details, { expected?: SubtagResult | BBTagRuntimeError; title?: string; }>,
//     automock?: AutoMock,
//     options?: HandleConfig<AutoMock, Details>
// ): void {
//     for (const testCase of cases) {
//         const title = testCase.title !== undefined ? ` - ${testCase.title}` : '';
//         it(`Should handle {${[subtag.name, ...testCase.args.map(arg => Array.isArray(arg) ? arg[0] : arg ?? '')].join(';')}}${title}`,
//             subtagInvokeTestCase(subtag, automock, options ?? {}, testCase));
//     }
// }

// function subtagInvokeTestCase<Details = undefined, AutoMock extends Record<string, unknown> = Record<string, never>>(
//     subtag: BaseSubtag,
//     automock: AutoMock | undefined,
//     options: HandleConfig<AutoMock, Details>,
//     testCase: TestCase<Details, { expected?: SubtagResult | BBTagRuntimeError; }>
// ): () => Promise<void> {
//     return async () => {
//         // arrange
//         const context = <HandleContext<AutoMock>>Object.fromEntries([
//             ['contextMock', mock(BBTagContext)] as const,
//             ['stateMock', mock<BBTagContextState>()] as const,
//             ...Object.entries(automock ?? {})
//                 .map(e => [e[0], mock(e[1])] as const)
//         ]);

//         const argRefs = testCase.args.map<ArgRef>((arg, i) => ({
//             code: [`ARG${i}`],
//             get resolveOrder() {
//                 switch (typeof arg) {
//                     case 'undefined': return undefined;
//                     case 'string': return [arg];
//                     default: return arg;
//                 }
//             },
//             get value() {
//                 switch (typeof arg) {
//                     case 'undefined': throw new Error('Arg should never resolve!');
//                     case 'string': return arg;
//                     default: return arg[0];
//                 }
//             }
//         }));

//         const call: BBTagASTCall = {
//             name: ['concat'],
//             args: argRefs.map(r => r.code),
//             start: { column: 0, index: 0, line: 0 },
//             end: { column: 0, index: 0, line: 0 },
//             source: ''
//         };

//         when(context.contextMock.state)
//             .thenReturn(instance(context.stateMock));
//         when(context.stateMock.subtags)
//             .thenReturn({});

//         for (const arg of argRefs) {
//             if (arg.resolveOrder !== undefined) {
//                 const iter = arg.resolveOrder[Symbol.iterator]();
//                 when(context.contextMock.eval(arg.code))
//                     .thenCall(() => {
//                         const next = iter.next();
//                         if (next.done === true)
//                             throw new Error('Values are exhausted!');
//                         return next.value;
//                     });
//             }
//         }

//         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//         options.arrange?.(context, testCase.details!, argRefs, call);

//         // act
//         const compiled = subtag.compile(instance(context.contextMock), subtag.name, call);
//         const invoke = typeof compiled !== 'function' ? () => compiled : compiled;
//         const result = typeof testCase.expected === 'object' && testCase.expected instanceof BBTagRuntimeError
//             ? await expectThrow(invoke)
//             : await invoke();

//         // asssert
//         if ('expected' in testCase) {
//             if (typeof testCase.expected === 'object' && testCase.expected instanceof BBTagRuntimeError
//                 && typeof result === 'object' && result instanceof BBTagRuntimeError) {
//                 expect(result).to.be.instanceOf(testCase.expected.constructor);
//                 const { stack: _1, ...actual } = result;
//                 const { stack: _2, ...expected } = testCase.expected;
//                 expect(actual).to.be.deep.equal(expected);
//             } else {
//                 expect(result).to.deep.equal(testCase.expected);
//             }

//         }
//         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//         options.assert?.(context, testCase.details!, result, argRefs, call);
//     };
// }

// async function expectThrow(action: () => Awaitable<unknown>): Promise<BBTagRuntimeError> {
//     try {
//         await action();
//         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
//         fail('Expected an error to be thrown');
//     } catch (err: unknown) {
//         if (typeof err === 'object' && err !== null && err instanceof BBTagRuntimeError)
//             return err;
//         throw err;
//     }
// }
