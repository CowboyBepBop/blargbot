import { SubtagParameterGroup } from '@cluster/types';

export function stringifyParameters(subtagName: string, parameters: readonly SubtagParameterGroup[]): string {
    return `{${[subtagName, ...parameters.map(stringifyParameter)].join(';')}}`;
}

function stringifyParameter(parameter: SubtagParameterGroup): string {
    if (parameter.values.length === 1) {
        let result = parameter.values[0].name;
        if (parameter.maxCount > 1)
            result += '...';
        return parameter.minCount === 0
            ? `[${result}]`
            : `<${result}>`;
    }

    if (parameter.maxCount === 1 && parameter.minCount === 1)
        return parameter.values.map(v => `<${v.name}>`).join(';');

    let result = `(${parameter.values.map(v => `<${v.name}>`).join(';')})`;
    if (parameter.maxCount > 1)
        result += '...';
    return parameter.minCount === 0
        ? `[${result}]`
        : `<${result}>`;
}
