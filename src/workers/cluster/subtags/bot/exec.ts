import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class ExecSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'exec',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['tag', 'args*'],
                    description: 'Executes another `tag`, giving it `args` as the input. Useful for modules.' +
                        '\n`{exec}` executes `tag` as if `tag`\'s code was in the root tag/ccommand.',
                    exampleCode: 'Let me do a tag for you. {exec;f}',
                    exampleOut: 'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5',
                    execute: (ctx, [tagName, ...args]) => this.executeTag(ctx, tagName.value, args.map(a => a.value))
                }
            ]
        });
    }

    public async executeTag(context: BBTagContext, tagName: string, args: string[]): Promise<string> {
        tagName = tagName.toLowerCase();
        const tag = await context.getCached(`tag_${tagName}`, (key) => context.database.tags.get(key));

        if (tag === null)
            throw new BBTagRuntimeError('Tag not found: ' + tagName);

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

        return await context.execute(tag.content, {
            tagName,
            cooldown: tag.cooldown ?? 0,
            inputRaw: input
        });
    }
}
