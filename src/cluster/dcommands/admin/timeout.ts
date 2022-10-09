import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';

const cmd = templates.commands.timeout;

export class TimeoutCommand extends GuildCommand {
    public constructor() {
        super({
            name: `timeout`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: cmd.flags.reason },
                { flag: `t`, word: `time`, description: cmd.flags.time }
            ],
            definitions: [
                {
                    parameters: `{user:member+}`,
                    description: cmd.user.description,
                    execute: (ctx, [user], flags) => this.timeout(ctx, user.asMember, flags)
                },
                {
                    parameters: `clear {user:member+}`,
                    description: cmd.clear.description,
                    execute: (ctx, [user], flags) => this.clearTimeout(ctx, user.asMember, flags.r?.merge().value ?? ``)
                }
            ]
        });
    }

    public async clearTimeout(context: GuildCommandContext, member: Member, reason: string): Promise<CommandResult> {
        switch (await context.cluster.moderation.timeouts.clearTimeout(member, context.author, context.author, reason)) {
            case `notTimedOut`: return `❌ **${humanize.fullName(member.user)}** is not currently timed out.`;
            case `noPerms`: return `❌ I don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure I have the \`moderate members\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure you have the \`moderate members\` permission or one of the permissions specified in the \`timeout override\` setting and try again.`;
            case `success`: return `✅ **${humanize.fullName(member.user)}** timeout has been removed.`;
        }
    }

    public async timeout(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<CommandResult> {
        const reason = flags.r?.merge().value ?? ``;
        const duration = (flags.t !== undefined ? parse.duration(flags.t.merge().value) : undefined) ?? moment.duration(1, `d`);

        switch (await context.cluster.moderation.timeouts.timeout(member, context.author, context.author, duration, reason)) {
            case `memberTooHigh`: return `❌ I don't have permission to timeout **${humanize.fullName(member.user)}**! Their highest role is above my highest role.`;
            case `moderatorTooLow`: return `❌ You don't have permission to timeout **${humanize.fullName(member.user)}**! Their highest role is above your highest role.`;
            case `noPerms`: return `❌ I don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure I have the \`moderate members\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure you have the \`moderate members\` permission or one of the permissions specified in the \`timeout override\` setting and try again.`;
            case `alreadyTimedOut`: return `❌ **${humanize.fullName(member.user)}** has already been timed out.`;
            case `success`: return `✅ **${humanize.fullName(member.user)}** has been timed out.`;
        }
    }
}
