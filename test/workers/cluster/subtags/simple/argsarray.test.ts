import { ArgsArraySubtag } from '@cluster/subtags/simple/argsarray';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ArgsArraySubtag(),
    cases: [
        {
            code: '{argsarray}',
            expected: '[]',
            setup(ctx) { ctx.options.inputRaw = ''; }
        },
        {
            code: '{argsarray}',
            expected: '["this","is","a","test"]',
            setup(ctx) { ctx.options.inputRaw = 'this is a test'; }
        },
        {
            code: '{argsarray}',
            expected: '["this","is a","test"]',
            setup(ctx) { ctx.options.inputRaw = 'this "is a" test'; }
        }
    ]
});
