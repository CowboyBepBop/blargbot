import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';

const cmd = templates.commands.prefix;

export class PrefixCommand extends GuildCommand {
    public constructor() {
        super({
            name: ``,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.list.description,
                    execute: ctx => this.listPrefixes(ctx)
                },
                {
                    parameters: `add|set|create {prefix}`,
                    description: cmd.add.description,
                    execute: (ctx, [prefix]) => this.addPrefix(ctx, prefix.asString)
                },
                {
                    parameters: `remove|delete {prefix}`,
                    description: cmd.remove.description,
                    execute: (ctx, [prefix]) => this.removePrefix(ctx, prefix.asString)
                }
            ]
        });
    }

    public async listPrefixes(context: GuildCommandContext): Promise<CommandResult> {
        let prefixes = await context.database.guilds.getSetting(context.channel.guild.id, `prefix`);
        if (typeof prefixes === `string`)
            prefixes = [prefixes];

        if (prefixes === undefined || prefixes.length === 0)
            return `❌ ${context.channel.guild.name} has no custom prefixes!`;
        return `ℹ️ ${context.channel.guild.name} has the following prefixes:\n${prefixes.map(p => ` - ${p}`).join(`\n`)}`;
    }

    public async addPrefix(context: GuildCommandContext, prefix: string): Promise<CommandResult> {
        let prefixes = await context.database.guilds.getSetting(context.channel.guild.id, `prefix`);
        switch (typeof prefixes) {
            case `undefined`:
                prefixes = [prefix];
                break;
            case `string`:
                prefixes = [prefixes, prefix];
                break;
            case `object`:
                prefixes = [...prefixes, prefix];
                break;
        }
        prefixes = [...new Set(prefixes)];
        await context.database.guilds.setSetting(context.channel.guild.id, `prefix`, prefixes);
        return `✅ The prefix has been added!`;
    }

    public async removePrefix(context: GuildCommandContext, prefix: string): Promise<CommandResult> {
        let prefixes = await context.database.guilds.getSetting(context.channel.guild.id, `prefix`);
        switch (typeof prefixes) {
            case `undefined`:
                prefixes = [];
                break;
            case `string`:
                prefixes = prefixes === prefix ? [] : [prefixes];
                break;
            case `object`:
                prefixes = prefixes.filter(p => p !== prefix);
                break;
        }
        await context.database.guilds.setSetting(context.channel.guild.id, `prefix`, prefixes);
        return `✅ The prefix has been removed!`;
    }
}
