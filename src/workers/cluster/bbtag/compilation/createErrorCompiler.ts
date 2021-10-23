import { BBTagASTCall, SubtagCompiler } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { BBTagRuntimeError } from '../errors';

export function createErrorCompiler(createError: ((context: BBTagContext, name: string, ast: BBTagASTCall) => BBTagRuntimeError)): SubtagCompiler {
    return {
        compile(...args) {
            return () => {
                const error = createError(...args);
                Error.captureStackTrace(error);
                throw error;
            };
        }
    };
}
