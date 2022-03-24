import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class CommandNameSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'commandname',
            category: SubtagType.BOT,
            desc: 'Gets the name of the current tag or custom command.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This command is {commandname}',
                    exampleIn: 'b!cc test',
                    exampleOut: 'This command is test',
                    returns: 'string',
                    execute: (ctx) => this.getTagName(ctx)
                }
            ]
        });
    }

    public getTagName(context: BBTagContext): string {
        return context.rootTagName;
    }
}
