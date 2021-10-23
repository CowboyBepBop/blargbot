// import { NotAnArrayError, VariableCache } from '@cluster/bbtag';
// import { ShiftSubtag } from '@cluster/subtags/array/shift';
// import { describe } from 'mocha';
// import { anyString, anything, deepEqual, instance, verify, when } from 'ts-mockito';

// import { testExecute, testExecuteFail, testExecuteNotEnoughArgs, testExecuteTooManyArgs } from '../baseSubtagTests';

// describe('{shift}', () => {
//     const subtag = new ShiftSubtag();
//     describe('#execute', () => {
//         testExecuteNotEnoughArgs(subtag, [
//             { args: [], expectedCount: 1 }
//         ]);
//         testExecuteFail(subtag, [
//             { args: ['123'], error: new NotAnArrayError('123'), details: { var: '123' } },
//             { args: ['[123'], error: new NotAnArrayError('[123'), details: { var: '[123' } }
//         ], {
//             dbMock: VariableCache
//         }, {
//             arrange(ctx, details) {
//                 when(ctx.contextMock.variables).thenReturn(instance(ctx.dbMock));
//                 when(ctx.dbMock.get(details.var)).thenResolve(undefined);
//             }
//         });
//         testExecute(subtag, [
//             {
//                 args: ['[]'],
//                 expected: undefined,
//                 details: {}
//             },
//             {
//                 args: ['{"n":"!arr","v":[]}'],
//                 expected: undefined,
//                 details: {}
//             },
//             {
//                 args: ['!arr'],
//                 expected: 7,
//                 details: { dbName: '!arr', get: [7, 8, 9], set: [8, 9] }
//             },
//             {
//                 args: ['["hi!"]'],
//                 expected: 'hi!',
//                 details: {}
//             },
//             {
//                 args: ['{"n":"@arr","v":[789]}'],
//                 expected: 789,
//                 details: { dbName: '@arr', set: [] }
//             },
//             {
//                 args: ['[1,2,3]'],
//                 expected: 1,
//                 details: {}
//             },
//             {
//                 args: ['{"n":"~arr","v":[1,2,3]}'],
//                 expected: 1,
//                 details: { dbName: '~arr', set: [2, 3] }
//             },
//             {
//                 args: ['~arr'],
//                 expected: undefined,
//                 details: { dbName: '~arr', get: [] }
//             }
//         ], {
//             dbMock: VariableCache
//         }, {
//             arrange(ctx, details) {
//                 if (details.dbName !== undefined) {
//                     when(ctx.contextMock.variables)
//                         .thenReturn(instance(ctx.dbMock));

//                     if (details.get !== undefined)
//                         when(ctx.dbMock.get(details.dbName))
//                             .thenResolve([...details.get]);

//                     if (details.set !== undefined)
//                         when(ctx.dbMock.set(details.dbName, deepEqual(details.set)))
//                             .thenResolve();

//                 }
//             },
//             assert(ctx, details) {
//                 if (details.dbName === undefined) {
//                     verify(ctx.dbMock.get(anyString()))
//                         .never();
//                     verify(ctx.dbMock.set(anyString(), anything()))
//                         .never();
//                 } else {
//                     if (details.get === undefined)
//                         verify(ctx.dbMock.get(details.dbName)).never();
//                     else
//                         verify(ctx.dbMock.get(details.dbName)).once();

//                     if (details.set === undefined)
//                         verify(ctx.dbMock.set(details.dbName, anything())).never();
//                     else
//                         verify(ctx.dbMock.set(details.dbName, deepEqual(details.set))).once();
//                 }
//             }
//         });
//         testExecuteTooManyArgs(subtag, [
//             { args: ['[1]', '[2]'], expectedCount: 1 }
//         ]);
//     });
// });
