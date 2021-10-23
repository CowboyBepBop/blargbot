import { humanize } from '@core/utils';
import { User } from 'discord.js';

import { BBTagRuntimeError } from './BBTagRuntimeError';

export class UserNotInGuildError extends BBTagRuntimeError {
    public constructor(
        public readonly user: User
    ) {
        super('User not in guild', `${humanize.fullName(user)} (${user.id}) is not on this guild`);
    }
}
