import { BaseSubtag, BBTagContext, NoUserFoundError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';
import { User } from 'discord.js';

export class ModlogSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'modlog',
            category: SubtagType.BOT,
            desc: 'If `moderator` is not provided or left empty, it will default to blargbot.',
            definition: [
                {
                    parameters: ['action', 'user', 'moderator?'],
                    description: 'Creates a custom modlog entry for the given `action` and `user`. ' +
                        '`moderator` must be a valid user if provided.',
                    exampleCode: 'You did a bad! {modlog;Bad;{userid}',
                    exampleOut: 'You did a bad! (modlog entry)',
                    execute: (ctx, [action, user, moderator]) => this.createModlog(ctx, action.value, user.value, moderator.value, '', '')
                },
                {
                    parameters: ['action', 'user', 'moderator', 'reason', 'color'],
                    description: 'Creates a custom modlog entry with the given `action` and `user` with `reason`. ' +
                        '`color` can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number. .',
                    exampleCode: 'You did a bad! {modlog;Bad;{userid};;They did a bad;#ffffff}',
                    exampleOut: 'You did a bad! (modlog entry with white embed colour and reason \'They did a bad!\'',
                    execute: (ctx, [action, user, moderator, reason, color]) => this.createModlog(ctx, action.value, user.value, moderator.value, reason.value, color.value)
                }
            ]
        });
    }

    public async createModlog(
        context: BBTagContext,
        action: string,
        userStr: string,
        modStr: string,
        reason: string,
        colorStr: string
    ): Promise<undefined> {
        const user = await context.queryUser(userStr);
        const color = colorStr !== '' ? parse.color(colorStr) : undefined;
        let mod: User | undefined;

        if (modStr !== '')
            mod = await context.queryUser(modStr); //TODO no user found for this?

        if (user === undefined)
            throw new NoUserFoundError(userStr);
        await context.util.cluster.moderation.modLog.logCustom(context.guild, action, user, mod ?? context.discord.user, reason, color);
        return undefined;
    }
}
