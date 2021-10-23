import { BBTagCompileResult } from '@cluster/types';

import { stringifyLocation } from './stringifyLocation';

export function stringifyCompileOutput(compiled: BBTagCompileResult): string {
    const lines = [];
    for (const error of compiled.errors)
        lines.push(`❌ ${error.subtag === undefined ? '' : `${stringifyLocation(error.subtag.start)}: `}${error.message}`);
    for (const warning of compiled.warnings)
        lines.push(`⚠️ ${warning.subtag === undefined ? '' : `${stringifyLocation(warning.subtag.start)}: `}${warning.message}`);
    return lines.join('\n');
}
