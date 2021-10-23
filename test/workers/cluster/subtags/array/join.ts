// import { NotAnArrayError, VariableCache } from '@cluster/bbtag';
// import { JoinSubtag } from '@cluster/subtags/array/join';
// import { describe } from 'mocha';
// import { instance, when } from 'ts-mockito';

// import { testExecute, testExecuteFail, testExecuteNotEnoughArgs, testExecuteTooManyArgs } from '../baseSubtagTests';

// describe('{join}', () => {
//     const subtag = new JoinSubtag();
//     describe('#execute', () => {
//         testExecuteNotEnoughArgs(subtag, [
//             { args: [], expectedCount: 2 },
//             { args: ['a'], expectedCount: 2 }
//         ]);
//         testExecuteFail(subtag, [
//             { args: ['123', '456'], error: new NotAnArrayError('123'), details: { var: '123' } },
//             { args: ['[123', '456'], error: new NotAnArrayError('[123'), details: { var: '[123' } }
//         ], {
//             dbMock: VariableCache
//         }, {
//             arrange(ctx, details) {
//                 when(ctx.contextMock.variables).thenReturn(instance(ctx.dbMock));
//                 when(ctx.dbMock.get(details.var)).thenResolve(undefined);
//             }
//         });
//         testExecute(subtag, [
//             { args: ['[]', '|'], expected: '' },
//             { args: ['{"n":"something","v":[]}', '|'], expected: '' },
//             { args: ['["hi!"]', '|'], expected: 'hi!' },
//             { args: ['{"n":"something","v":[789]}', '|'], expected: '789' },
//             { args: ['[1,2,3]', '|'], expected: '1|2|3' },
//             { args: ['[1,2,3]', ''], expected: '123' },
//             { args: ['["a","b","c"]', '{}'], expected: 'a{}b{}c' },
//             { args: ['{"n":"something","v":["a",123,"b",456,"c"]}', ''], expected: 'a123b456c' }
//         ]);
//         testExecuteTooManyArgs(subtag, [
//             { args: ['123', '456', '789'], expectedCount: 2 }
//         ]);
//     });
// });
