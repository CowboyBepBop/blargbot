import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';

export class EmbedSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'embed',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['embed'],
                    description: 'Takes whatever input you pass to `embed` and attempts to form an embed from it. `embed` must be a valid json embed object.\n' +
                        'This subtag works well with `{embedbuild}`. If attempting to use inside of a `{send}`, `{edit}` or `{dm}`, you should not include `{embed}`, ' +
                        'and instead just pass the content direct to `{send}`/`{edit}`/`{dm}`\n' +
                        'You can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) ' +
                        'and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds ' +
                        '[here](https://leovoel.github.io/embed-visualizer/)',
                    exampleCode: '{embed;{lb}"title":"Hello!"{rb}}',
                    exampleOut: '(an embed with "Hello!" as the title)',
                    execute: (ctx, [embed]) => this.setEmbed(ctx, embed.value)
                }
            ]
        });
    }

    public setEmbed(context: BBTagContext, embedStr: string): undefined {
        context.state.embed = discordUtil.parseEmbed(embedStr);
        return undefined;
    }
}
