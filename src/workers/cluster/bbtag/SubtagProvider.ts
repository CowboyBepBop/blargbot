import { SubtagCompiler } from '@cluster/types';

import { BaseSubtag } from './BaseSubtag';

export class SubtagProvider {
    private readonly overrides: Record<string, SubtagCompiler[] | undefined>;

    public constructor(
        private readonly source: { get(name: string): BaseSubtag | undefined; }
    ) {
        this.overrides = {};
    }

    public get(name: string): SubtagCompiler | undefined {
        name = name.toLowerCase();
        const overrides = this.overrides[name];
        return overrides?.[overrides.length - 1] ?? this.source.get(name);
    }

    public set(name: string, compiler: SubtagCompiler): { reset(): void; } {
        name = name.toLowerCase();
        const overrides = this.overrides[name] ??= [];
        overrides.push(compiler);
        return {
            reset() {
                overrides.splice(overrides.indexOf(compiler), 1);
            }
        };
    }
}
