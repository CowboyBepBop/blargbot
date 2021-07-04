const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class ThesearchCommand extends BaseCommand {
    constructor() {
        super({
            name: 'thesearch',
            category: newbutils.commandTypes.IMAGE,
            usage: 'thesearch [text]',
            info: 'Tells everyone about the progress of the search for intelligent life.'
        });
    }

    async execute(msg, words) {
        let text = 'I use betterdiscord';
        if (words[1]) text = words.slice(1).join(' ');
        text = await bu.filterMentions(text);
        bot.sendChannelTyping(msg.channel.id);

        let code = bu.genEventCode();
        let buffer = await bu.awaitEvent({
            cmd: 'img',
            command: 'thesearch',
            code: code,
            text
        });

        await bu.send(msg, undefined, {
            file: buffer,
            name: 'TheSearch.png'
        });
    }
}

module.exports = ThesearchCommand;
