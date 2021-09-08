import { BaseGuildCommand } from '@cluster/command';
import { FlagResult, GuildCommandContext } from '@cluster/types';
import { CommandType, humanize, ModerationType, parse, pluralise as p } from '@cluster/utils';
import { GuildMember } from 'discord.js';

export class WarnCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'warn',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the warning.' },
                {
                    flag: 'c',
                    word: 'count',
                    description: 'The number of warnings that will be issued.'
                }
            ],
            definitions: [
                {
                    parameters: '{user:member+}',
                    description: 'Issues a warning.\n' +
                        'If mod-logging is enabled, the warning will be logged.\n' +
                        'If `kickat` and `banat` have been set using the `settings` command, the target could potentially get banned or kicked.',
                    execute: (ctx, [user], flags) => this.warn(ctx, user.asMember, flags)
                }
            ]
        });
    }

    public async warn(context: GuildCommandContext, member: GuildMember, flags: FlagResult): Promise<string> {
        const reason = flags.r?.merge().value;
        const count = parse.int(flags.c?.merge().value ?? 1);

        const result = await context.cluster.moderation.warns.warn(member, context.author, count, reason);
        const preamble = `**${humanize.fullName(member.user)}** has been given ${count} ${p(count, 'warning')}.`;
        const actionStr = getActionString(result.type);
        switch (result.state) {
            case 'countNaN': return this.error(`${flags.c?.merge().value ?? ''} isnt a number!`);
            case 'countNegative': return this.error('I cant give a negative amount of warnings!');
            case 'countZero': return this.error('I cant give zero warnings!');
            case 'alreadyBanned': return this.warning(preamble, 'They went over the limit for bans, but they were already banned.');
            case 'memberTooHigh': return this.warning(preamble, `They went over the limit for ${actionStr}s but they are above me so I couldnt ${actionStr} them.`);
            case 'moderatorTooLow': return this.warning(preamble, `They went over the limit for ${actionStr}s but they are above you so I didnt ${actionStr} them.`);
            case 'noPerms': return this.warning(preamble, `They went over the limit for ${actionStr}s but I dont have permission to ${actionStr} them.`);
            case 'moderatorNoPerms': return this.warning(preamble, `They went over the limit for ${actionStr}s but you dont have permission to ${actionStr} them.`);
            case 'success': {
                switch (result.type) {
                    case ModerationType.WARN: return this.success(`${preamble} They now have ${result.count} warnings.`);
                    case ModerationType.BAN: return this.success(`${preamble} They went over the limit for bans and so have been banned.`);
                    case ModerationType.KICK: return this.success(`${preamble} They went over the limit for kicks and so have been kicked.`);
                }
            }
        }
    }
}

function getActionString(type: ModerationType): string {
    switch (type) {
        case ModerationType.BAN: return 'ban';
        case ModerationType.KICK: return 'kick';
        case ModerationType.WARN: return 'warn';
    }
}
