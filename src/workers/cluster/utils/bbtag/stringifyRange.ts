import { BBTagASTCall } from '@cluster/types';

import { stringifyLocation } from './stringifyLocation';

export function stringifyRange(bbtag: BBTagASTCall): string {
    return `${stringifyLocation(bbtag.start)}:${stringifyLocation(bbtag.end)}`;
}
