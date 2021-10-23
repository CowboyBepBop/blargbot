import { BaseSubtag, BBTagContext, BBTagRuntimeError } from '@cluster/bbtag';
import { discordUtil, guard, mapping, SubtagType } from '@cluster/utils';
import { GuildChannelCreateOptions, OverwriteData } from 'discord.js';

export class ChannelCreateSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'channelcreate',
            category: SubtagType.CHANNEL,
            desc: '`type` is either `text`, `voice`, `category`, `news` or `store`.\n',
            definition: [
                {
                    parameters: ['name', 'type?:text'],
                    description: 'Creates a channel of type `type`',
                    exampleCode: '{channelcreate;super-voice-channel;voice}',
                    exampleOut: '11111111111111111',
                    execute: (ctx, [name, type]) => this.channelCreate(ctx, name.value, type.value, '{}')
                },
                {
                    parameters: ['name', 'type:text', 'options:{}'],
                    description: 'Creates a channel with the specified `options` of type `type`' +
                        '`options` is a JSON object, containing any or all of the following properties:\n' +
                        '- `topic`\n' +
                        '- `nsfw`\n' +
                        '- `parentID`\n' +
                        '- `reason` (displayed in audit log)\n' +
                        '- `rateLimitPerUser`\n' +
                        '- `bitrate` (voice)\n' +
                        '- `userLimit` (voice)\n' +
                        'Returns the new channel\'s ID.',
                    exampleCode: '{channelcreate;super-channel;;{json;{"parentID":"11111111111111111"}}}',
                    exampleOut: '22222222222222222',
                    execute: (ctx, [name, type, options]) => this.channelCreate(ctx, name.value, type.value, options.value)
                }
            ]
        });
    }

    public async channelCreate(
        context: BBTagContext,
        name: string,
        typeKey: string,
        optionsJson: string
    ): Promise<string> {
        const permissions = context.permissions;
        if (permissions.has('MANAGE_CHANNELS') !== true)
            throw new BBTagRuntimeError('Author cannot create channels');

        let options: GuildChannelCreateOptions;
        try {
            const mapped = mapOptions(optionsJson);
            if (!mapped.valid)
                throw new BBTagRuntimeError('Invalid JSON');
            options = mapped.value;
        } catch (e: unknown) {
            throw new BBTagRuntimeError('Invalid JSON');
        }

        options.type = guard.hasProperty(channelTypes, typeKey) ? channelTypes[typeKey] : undefined;

        try {
            options.reason = context.scope.reason !== undefined
                ? discordUtil.formatAuditReason(context.user, context.scope.reason)
                : options.reason;
            const channel = await context.guild.channels.create(name, options);
            return channel.id;
        } catch (err: unknown) {
            context.logger.error(err);
            throw new BBTagRuntimeError('Failed to create channel: no perms');
        }
    }
}

const channelTypes = {
    text: 'GUILD_TEXT',
    voice: 'GUILD_VOICE',
    category: 'GUILD_CATEGORY',
    news: 'GUILD_NEWS',
    store: 'GUILD_STORE'
} as const;

const mapOptions = mapping.mapJson(
    mapping.mapObject<GuildChannelCreateOptions>({
        bitrate: mapping.mapOptionalNumber,
        nsfw: mapping.mapOptionalBoolean,
        parent: ['parentID', mapping.mapOptionalString],
        rateLimitPerUser: mapping.mapOptionalNumber,
        topic: mapping.mapOptionalString,
        userLimit: mapping.mapOptionalNumber,
        permissionOverwrites: mapping.mapArray<OverwriteData, undefined>(
            mapping.mapObject<OverwriteData>({
                allow: mapping.mapOptionalBigInt,
                deny: mapping.mapOptionalBigInt,
                id: mapping.mapString,
                type: mapping.mapIn('role', 'member')
            }),
            { ifUndefined: mapping.result.undefined }
        ),
        reason: mapping.mapOptionalString,
        position: mapping.mapOptionalNumber,
        type: [undefined]
    })
);
