import { BBTagAST, BBTagASTCall } from '@cluster/types';

export function stringify(bbtag: BBTagAST | BBTagASTCall): string {
    if (Array.isArray(bbtag)) {
        return bbtag.map(val => typeof val === 'string' ? val : stringify(val)).join('');
    }

    const parts = [bbtag.name, ...bbtag.args]
        .map(stringify)
        .join('');
    return `{${parts}}`;
}
