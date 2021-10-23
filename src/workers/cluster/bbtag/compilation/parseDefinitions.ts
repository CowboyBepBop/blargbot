import { SubtagHandlerCallSignature, SubtagHandlerDefinition, SubtagHandlerDefinitionParameterGroup, SubtagParameter, SubtagParameterGroup } from '@cluster/types';

export function parseDefinitions(definitions: readonly SubtagHandlerDefinition[]): readonly SubtagHandlerCallSignature[] {
    return definitions.map(parseDefinition);
}

function parseDefinition(definition: SubtagHandlerDefinition): SubtagHandlerCallSignature {
    const parameters = definition.parameters.map(p => parseParameter(p));
    switch (definition.type) {
        case 'constant': return { ...definition, parameters };
        case 'executable':
        case undefined: return { ...definition, parameters, type: 'executable', execute: definition.execute };
    }
}

function parseParameter(parameter: string | string[] | SubtagHandlerDefinitionParameterGroup): SubtagParameterGroup {
    if (typeof parameter === 'string') {
        const value = { ...parseParameterValue(parameter) };
        let range = parameterQuantifierMap[value.name[value.name.length - 1]];
        let name = value.name;
        if (range !== undefined) {
            name = name.slice(0, name.length - 1);
        } else {
            const match = /^(.*?)\+(\d)$/.exec(parameter);
            range = match !== null ? [parseInt(match[2]), Infinity] : [1, 1];
        }
        return {
            minCount: range[0],
            maxCount: range[1],
            values: [{ ...value, name }]
        };
    } else if (Array.isArray(parameter)) {
        return {
            maxCount: Infinity,
            minCount: 0,
            values: parameter.map(parseParameterValue)
        };
    }

    return {
        maxCount: parameter.maxCount ?? Infinity,
        minCount: parameter.minCount ?? 0,
        values: parameter.parameters.map(parseParameterValue)
    };
}

function parseParameterValue(parameter: string): SubtagParameter {
    let autoResolve = true;
    if (parameter.startsWith('~')) {
        autoResolve = false;
        parameter = parameter.slice(1);
    }

    const match: Record<string, string | undefined> = /^(?<parameter>.*?)(?::(?<defaultValue>.*?))?(?:#(?<maxLength>\d+))?$/.exec(parameter)?.groups ?? {};
    const { defaultValue = '', maxLength = '1000000', parameter: param } = match;

    return {
        name: param ?? parameter,
        autoResolve,
        defaultValue,
        maxLength: parseInt(maxLength)
    };
}

const parameterQuantifierMap: Record<string, [minCount: number, maxCount: number] | undefined> = {
    '?': [0, 1],
    '*': [0, Infinity],
    '+': [1, Infinity],
    '!': [1, 1]
};
