import { Message, MessageFile } from 'eris';
import { Cluster } from '../cluster';
import { commandTypes, FlagResult } from '../utils';
import { BaseCommand } from '../core/command';

export class ArtCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'art',
            category: commandTypes.IMAGE,
            info: 'Shows everyone a work of art.',
            flags: [{ flag: 'I', word: 'image', desc: 'A custom image.' }],
            cooldown: 5000,
            definition: {
                parameters: '{user?}',
                dontBind: true,
                execute: (msg, args, flags) => this.art(msg, args.join(' '), flags),
                description: 'Shows everyone a work of art.'
            }
        });
        this.ratelimit.push(m => m.author.id);
        this.ratelimit.push(m => m.channel.id);
    }

    private async art(message: Message, user: string | undefined, flags: FlagResult): Promise<void | string | MessageFile> {
        let url;
        if (message.attachments.length > 0) {
            url = message.attachments[0].url;
        } else if (flags.I) {
            url = flags.I.join(' ');
        } else if (user) {
            const u = await this.util.getUser(message, user);
            if (!u)
                return;
            url = u.avatarURL;
        } else {
            url = message.author.avatarURL;
        }

        void this.discord.sendChannelTyping(message.channel.id);

        const buffer = await this.cluster.images.render('art', { avatar: url });
        if (!buffer || buffer.length === 0) {
            return '❌ Something went wrong while trying to render that!';
        } else {
            return {
                file: buffer,
                name: 'sobeautifulstan.png'
            };
        }
    }
}