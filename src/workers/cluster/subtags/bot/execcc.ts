import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ExecccSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'execcc',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['ccommand', 'args*'],
                    description: 'Executes another `ccommand`, giving it `args` as the input. Useful for modules.' +
                        '\n`{exec}` executes `ccommand` as if `ccommand`\'s code was in the root ccommand.',
                    exampleCode: 'Let me do a ccommand for you. {execcc;f}',
                    exampleOut: 'Let me do a ccommand for you. User#1111 has paid their respects. Total respects given: 5',
                    execute: (ctx, [commandName, ...args]) => this.executeCustomCommand(ctx, commandName.value, args.map(a => a.value))
                }
            ]
        });
    }

    public async executeCustomCommand(context: BBTagContext, commandName: string, args: string[]): Promise<string> {
        commandName = commandName.toLowerCase();
        const ccommand = await context.getCached(`cc_${commandName}`, async (key) => context.database.guilds.getCommand(context.guild.id, key));

        if (ccommand === null)
            throw new BBTagRuntimeError('CCommand not found: ' + commandName);
        if ('alias' in ccommand)
            throw new BBTagRuntimeError('Cannot execcc imported tag: ' + commandName);

        let input: string;
        switch (args.length) {
            case 0:
                input = '';
                break;
            case 1:
                input = args[0];
                break;
            default:
                input = args.map(a => `"${a}"`).join(' ');
        }

        return context.execute(ccommand.content, {
            tagName: commandName,
            cooldown: ccommand.cooldown ?? 0,
            inputRaw: input
        });
    }
}
