import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class ExecSubtag extends Subtag {
    public constructor() {
        super({
            name: 'exec',
            category: SubtagType.BOT
        });
    }

    @Subtag.signature('string', [
        Subtag.context(),
        Subtag.argument('tagName', 'string'),
        Subtag.argument('args', 'string', { repeat: [0, Infinity] })
    ], {
        description: 'Executes another `tag`, giving it `args` as the input. Useful for modules.' +
            '\n`{exec}` executes `tag` as if `tag`\'s code was in the root tag/ccommand.',
        exampleCode: 'Let me do a tag for you. {exec;f}',
        exampleOut: 'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5'
    })
    public async execTag(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name.toLowerCase();
        const tag = await context.getCached('tag', tagName, (key) => context.database.tags.get(key));

        if (tag === null)
            throw new BBTagRuntimeError('Tag not found: ' + tagName);

        const childContext = context.makeChild({
            tagName,
            cooldown: tag.cooldown ?? 0,
            inputRaw: args.map(a => `"${a}"`).join(' ')
        });

        context.scopes.pushScope(true);
        try {
            const result = await context.engine.execute(tag.content, childContext);
            return result.content;
        } finally {
            context.errors.push(...childContext.errors);
            context.scopes.popScope();
        }
    }
}
