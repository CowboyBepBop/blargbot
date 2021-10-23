import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { discordUtil, mapping, SubtagType } from '@cluster/utils';
import { TypeMapping } from '@core/types';
import { guard } from '@core/utils';
import { ChannelData, GuildChannels, ThreadEditData } from 'discord.js';

export class ChannelEditSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channeledit',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'options?:{}'],
                    description: 'Edits a channel with the given information.\n' +
                        '`options` is a JSON object, containing any or all of the following properties:\n' +
                        '- `name`\n' +
                        '- `topic`\n' +
                        '- `nsfw`\n' +
                        '- `parentID`\n' +
                        '- `reason` (displayed in audit log)\n' +
                        '- `rateLimitPerUser`\n' +
                        '- `bitrate` (voice)\n' +
                        '- `userLimit` (voice)\n' +
                        'Returns the channel\'s ID.',
                    exampleCode: '{channeledit;11111111111111111;{j;{"name": "super-cool-channel"}}}',
                    exampleOut: '11111111111111111',
                    execute: (ctx, args) => this.channelEdit(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async channelEdit(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const channel = await context.queryChannel(args[0]);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO no channel found error

        const permission = channel.permissionsFor(context.authorizer);

        if (permission?.has('MANAGE_CHANNELS') !== true)
            throw new BBTagRuntimeError('Author cannot edit this channel');

        return guard.isThreadChannel(channel)
            ? await this.channelEditCore(context, channel, args[1], mapThreadOptions)
            : await this.channelEditCore(context, channel, args[1], mapChannelOptions);
    }

    private async channelEditCore<T>(
        context: BBTagContext,
        channel: Extract<GuildChannels, { edit(data: T, fullReason?: string): Promise<unknown>; }>,
        editJson: string,
        mapping: TypeMapping<T>
    ): Promise<string> {
        let options: T;
        try {
            const mapped = mapping(editJson);
            if (!mapped.valid)
                throw new BBTagRuntimeError('Invalid JSON');
            options = mapped.value;
        } catch (e: unknown) {
            throw new BBTagRuntimeError('Invalid JSON');
        }

        try {
            const fullReason = discordUtil.formatAuditReason(
                context.user,
                context.scope.reason ?? ''
            );
            await channel.edit(options, fullReason);
            return channel.id;
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to edit channel: no perms');
        }
    }
}

const mapChannelOptions = mapping.mapJson(
    mapping.mapObject<ChannelData>({
        bitrate: mapping.mapOptionalNumber,
        name: mapping.mapOptionalString,
        nsfw: mapping.mapOptionalBoolean,
        parent: ['parentID', mapping.mapOptionalString],
        rateLimitPerUser: mapping.mapOptionalNumber,
        topic: mapping.mapOptionalString,
        userLimit: mapping.mapOptionalNumber,
        defaultAutoArchiveDuration: mapping.mapIn(60, 1440, 4320, 10080, undefined),
        lockPermissions: mapping.mapOptionalBoolean,
        permissionOverwrites: [undefined],
        position: mapping.mapOptionalNumber,
        rtcRegion: [undefined],
        type: [undefined]
    })
);

const mapThreadOptions = mapping.mapJson(
    mapping.mapObject<ThreadEditData>({
        archived: mapping.mapOptionalBoolean,
        autoArchiveDuration: mapping.mapIn(60, 1440, 4320, 10080, undefined),
        locked: mapping.mapOptionalBoolean,
        name: mapping.mapOptionalString,
        rateLimitPerUser: mapping.mapOptionalNumber
    })
);
