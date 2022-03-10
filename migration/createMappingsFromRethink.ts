import 'module-alias/register';

import config from '@config';
import { createLogger } from '@core/Logger';
import { TypeMapping } from '@core/types';
import { mapping } from '@core/utils';
import fs from 'fs/promises';
import path from 'path';
import * as r from 'rethinkdb';

void (async function () {
    const logger = createLogger(config, 'MAPFAC');
    const [rethink] = await Promise.all([
        r.connect({
            ...config.rethink,
            timeout: 10000
        })
    ]);

    const dbName = config.rethink.db as string | undefined;

    const tables = await r.db(dbName ?? 'blargbot').tableList().run(rethink);
    logger.info('Found tables', tables);
    for (const table of tables) {
        logger.info('Getting data from table', table);
        const builder = new MappingBuilder();
        const outFile = path.join(__dirname, `/${table}.mapping`);
        const tableTitle = `${table[0].toUpperCase()}${table.slice(1)}`;
        const buildSource = await r.table(table).run(rethink);
        const currentMapping = await getCurrentMapping(tableTitle, outFile);
        let accepted = 0;
        let rejected = 0;
        for await (const record of cursorToAsyncIterable(buildSource)) {
            if (currentMapping?.(record).valid === true) accepted++;
            else rejected++;

            builder.addExample(record);
            if ((accepted + rejected) % 10000 === 0)
                logger.info('Building', table, 'mapping:', accepted + rejected, 'records found...');
        }

        if (currentMapping === undefined) {
            logger.info('Creating a mapping for the new table', table);
        } else if (rejected === 0) {
            logger.info('The current mapping accepted all (', accepted, ') records, discarding generated mapping');
            continue;
        } else {
            logger.info('The current mapping failed to accept', rejected, '/', rejected + accepted, 'records. Replacing with new mapping');
        }

        const result = builder.buildMapping();
        const validateSource = await r.table(table).run(rethink);
        const failedRecords = [];
        let validRecords = 0;
        for await (const record of cursorToAsyncIterable(validateSource)) {
            if (!result(record).valid)
                failedRecords.push(record);
            else
                validRecords++;
            if ((validRecords + failedRecords.length) % 10000 === 0)
                logger.info('Validating', table, 'mapping:', validRecords + failedRecords.length, 'tested,', failedRecords.length, 'failed.');
        }

        if (failedRecords.length > 0)
            logger.error('Generated mapping for', table, 'had', failedRecords.length, '/', validRecords, 'failures!');
        else
            logger.info('Generated mapping for', table, 'had', validRecords, 'successes');

        await fs.writeFile(`${outFile}.ts`, `/* Autogenerated mapping by ${__filename} */

import { mapping } from '@core/utils';

export type OldRethink${tableTitle} = Extract<ReturnType<typeof map${tableTitle}>, { valid: true; }>['value'];
export const map${tableTitle} = ${[...builder.getSource('mapping')].join('\n')};
`
        );
        logger.info('Written auto-generated mapping to', path.resolve(outFile));

    }
    logger.info('Mapping generation complete!');
    process.exit();
})();

async function getCurrentMapping(table: string, file: string): Promise<TypeMapping<unknown> | undefined> {
    try {
        const currentMappingExport = await import(`${file}.js`) as Partial<Record<string, TypeMapping<unknown>>>;
        return currentMappingExport[`map${table}`];
    } catch {
        return undefined;
    }
}

async function* cursorToAsyncIterable<T>(cursor: r.Cursor<T>): AsyncIterable<T> {
    while (true) {
        try {
            yield await cursor.next();
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.')
                break;
            throw err;
        }
    }
}

type MappingBuilderChoiceMap = Partial<{
    'string': MappingRef;
    'number': MappingRef;
    'boolean': MappingRef;
    'function': MappingRef;
    'symbol': MappingRef;
    'bigint': MappingRef;
    'array': MappingArrayBuilder;
    'object': MappingObjectBuilder;
    'date': MappingRef;
}>

class MappingBuilder {
    readonly #choices: MappingBuilderChoiceMap = {};
    #allowNull = false;
    #allowUndefined = false;

    public addExample(...examples: unknown[]): void {
        for (const example of examples) {
            switch (typeof example) {
                case 'object':
                    if (example === null) {
                        this.#allowNull = true;
                    } else if (Array.isArray(example)) {
                        this.#choices.array ??= new MappingArrayBuilder();
                        this.#choices.array.addExample(example);
                    } else if (example instanceof Date) {
                        this.#choices.date ??= new MappingRef('date');
                    } else {
                        this.#choices.object ??= new MappingObjectBuilder();
                        this.#choices.object.addExample(example as Readonly<Record<PropertyKey, unknown>>);
                    }
                    break;
                case 'bigint': this.#choices.bigint ??= new MappingRef('bigInt');
                    break;
                case 'boolean': this.#choices.boolean ??= new MappingRef('boolean');
                    break;
                case 'function': this.#choices.function ??= new MappingRef('never');
                    break;
                case 'number': this.#choices.number ??= new MappingRef('number');
                    break;
                case 'string': this.#choices.string ??= new MappingRef('string');
                    break;
                case 'symbol': this.#choices.symbol ??= new MappingRef('never');
                    break;
                case 'undefined': this.#allowUndefined = true;
                    break;
            }
        }
    }

    public buildMapping(): TypeMapping<unknown> {
        const code = `mapping => ${[...this.getSource('mapping')].join('\n')}`;
        const factory = eval(code) as (m: typeof mapping) => TypeMapping<unknown>;
        return factory(mapping);
    }

    public * getSource(mappingName: string): Iterable<string> {
        const choices = Object.entries(this.#choices)
            .sort((a, b) => a[0] > b[0] ? 1 : -1)
            .map(c => c[1])
            .filter((v): v is Exclude<typeof v, undefined> => v !== undefined);
        const modifier = this.#allowUndefined
            ? this.#allowNull ? '.nullish' : '.optional'
            : this.#allowNull ? '.nullable' : '' as const;

        if (choices.length === 0) {
            const allow = [];
            if (this.#allowNull) allow.push('null');
            if (this.#allowUndefined) allow.push('undefined');
            if (allow.length === 0)
                yield `${mappingName}.never`;
            else
                yield `${mappingName}.in(${allow.join(',')})`;
        } else if (choices.length === 1) {
            yield* yieldWithTransform(choices[0].getSource(mappingName), {
                last: v => `${v}${modifier}`
            });
        } else {
            yield 'mapping.choice(';
            yield* joinAndFlatten(choices, c => yieldWithTransform(c.getSource(mappingName), {
                all: v => `    ${v}`
            }), ',');
            yield `)${modifier}`;
        }
    }
}

class MappingArrayBuilder {
    readonly #elements: MappingBuilder = new MappingBuilder();

    public addExample(example: readonly unknown[]): void {
        this.#elements.addExample(...example);
    }

    public * getSource(mappingName: string): Iterable<string> {
        yield* yieldWithTransform(this.#elements.getSource(mappingName), {
            first: v => `${mappingName}.array(${v}`,
            last: v => `${v})`
        });
    }
}

class MappingObjectBuilder {
    #examples = 0;
    readonly #properties: Record<string, { builder: MappingBuilder; count: number; } | undefined> = {};
    readonly #record: MappingBuilder = new MappingBuilder();

    public addExample(example: Readonly<Record<PropertyKey, unknown>>): void {
        this.#examples++;
        for (const [key, value] of Object.entries(example)) {
            const prop = this.#properties[key] ??= { builder: new MappingBuilder(), count: 0 };
            prop.builder.addExample(value);
            this.#record.addExample(value);
            prop.count++;
        }
    }

    public * getSource(mappingName: string): Iterable<string> {
        const properties = Object.entries(this.#properties)
            .sort((a, b) => a[0] > b[0] ? 1 : -1)
            .filter((v): v is [typeof v[0], Exclude<typeof v[1], undefined>] => v[1] !== undefined);
        if (properties.length === 0)
            return yield `${mappingName}.object({})`;

        if (properties.length > 100 || properties.some(p => /^\d+$/.test(p[0])) || properties.every(p => p[0].length <= 1)) {
            yield* yieldWithTransform(this.#record.getSource(mappingName), {
                first: v => `${mappingName}.record(${v}`,
                last: v => `${v}.optional)`
            });
            return;
        }

        yield `${mappingName}.object({`;
        yield* joinAndFlatten(properties, p => {
            const propName = JSON.stringify(p[0]).slice(1, -1);
            if (p[1].count < this.#examples)
                p[1].builder.addExample(undefined);
            return yieldWithTransform(p[1].builder.getSource(mappingName), {
                first: v => `['${propName}']: ${v}`,
                all: v => `    ${v}`
            });
        }, ',');
        yield '})';
    }
}

class MappingRef {
    readonly #src: string;

    public constructor(src: string) {
        this.#src = src;
    }

    public getSource(mappingName: string): Iterable<string> {
        return [`${mappingName}.${this.#src}`];
    }
}

function* yieldWithTransform<T>(
    source: Iterable<T>,
    mappings: {
        first?: (value: T) => T;
        middle?: (value: T) => T;
        last?: (value: T) => T;
        all?: (value: T) => T;
    }
): Iterable<T> {
    const first = mappings.first ?? (v => v);
    const middle = mappings.middle ?? (v => v);
    const last = mappings.last ?? (v => v);
    const all = mappings.all ?? (v => v);
    const iter = source[Symbol.iterator]();
    let next = iter.next();
    if (next.done === true) // 0 elements
        return;

    let prev = next;

    next = iter.next();
    if (next.done === true) // 1 element
        return yield last(all(first(prev.value)));

    // 2+ elements
    yield all(first(prev.value));
    prev = next;

    while ((next = iter.next()).done !== true) {
        yield middle(all(prev.value));
        prev = next;
    }

    yield last(all(prev.value));
}

function* joinAndFlatten<T>(source: Iterable<T>, getLines: (value: T) => Iterable<string>, join: string): Iterable<string> {
    const iter = source[Symbol.iterator]();
    let next = iter.next();
    if (next.done === true) // 0 elements
        return;

    let prev = next;

    // 1+ elements
    while ((next = iter.next()).done !== true) {
        yield* yieldWithTransform(getLines(prev.value), { last: v => `${v}${join}` });
        prev = next;
    }

    yield* getLines(prev.value);
}
