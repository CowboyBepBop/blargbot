import { BaseSubtag, BBTagContext, BBTagRuntimeError, NoUserFoundError } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class KickSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'kick',
            category: SubtagType.USER,
            desc: 'If the kick is successful, `Success` will be returned, otherwise the error will be given. ',
            definition: [
                {
                    parameters: ['user'],
                    description: 'Kicks `user`.',
                    exampleCode: '{kick;stupid cat} @stupid cat was kicked!',
                    exampleOut: 'Succes @stupid cat was kicked',
                    execute: (ctx, [user]) => this.kickMember(ctx, user.value, '', '')
                },
                {
                    parameters: ['user', 'reason', 'noPerms?'],
                    description: 'Kicks `user`. ' +
                        'If `noPerms` is provided and not an empty string, do not check if the command executor is actually able to kick people. ' +
                        'Only provide this if you know what you\'re doing.',
                    exampleCode: '{kick;stupid cat;because I can} @stupid cat was kicked!',
                    exampleOut: 'Success @stupid cat was kicked, because I can!',
                    execute: (ctx, [user, reason, noPerms]) => this.kickMember(ctx, user.value, reason.value, noPerms.value)
                }
            ]
        });
    }

    public async kickMember(
        context: BBTagContext,
        userStr: string,
        reason: string,
        nopermsStr: string
    ): Promise<string> {
        const user = await context.queryUser(userStr, {
            noErrors: context.scope.noLookupErrors, noLookup: true //TODO why?
        });

        const noPerms = nopermsStr !== '' ? true : false;
        if (user === undefined)
            throw new NoUserFoundError(userStr);
        const member = await context.util.getMember(context.guild.id, user.id);
        if (member === undefined)
            throw new NoUserFoundError(userStr);

        const response = await context.util.cluster.moderation.bans.kick(member, context.user, noPerms, reason);

        switch (response) {
            case 'success': //Successful
                return 'Success'; //TODO true/false response
            case 'noPerms': //Bot doesnt have perms
                throw new BBTagRuntimeError('I don\'t have permission to kick users!');
            case 'memberTooHigh': //Bot cannot kick target
                throw new BBTagRuntimeError(`I don't have permission to kick ${user.username}!`);
            case 'moderatorNoPerms': //User doesnt have perms
                throw new BBTagRuntimeError('You don\'t have permission to kick users!');
            case 'moderatorTooLow': //User cannot kick target
                throw new BBTagRuntimeError(`You don't have permission to kick ${user.username}!`);
        }
    }
}
