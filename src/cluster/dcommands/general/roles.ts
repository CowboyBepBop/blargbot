import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';

const cmd = templates.commands.roles;

export class RolesCommand extends GuildCommand {
    public constructor() {
        super({
            name: `roles`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.default.description,
                    execute: ctx => this.showRoles(ctx)
                }
            ]
        });
    }

    public showRoles(context: GuildCommandContext): CommandResult {
        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: `Roles`,
            description: [...context.channel.guild.roles.values()]
                .sort((a, b) => b.position - a.position)
                .map(r => `${r.mention} (${r.id})`)
                .join(`\n`)
        };
    }
}
