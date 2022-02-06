import { RbSubtag } from '@cluster/subtags/simple/rb';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RbSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        { code: '{rb}', expected: '}' }
    ]
});
