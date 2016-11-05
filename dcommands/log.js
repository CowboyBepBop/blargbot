var e = module.exports = {};

e.init = () => {
    e.category = bu.CommandType.COMMANDER;
};
e.isCommand = true;

e.hidden = false;
e.usage = 'log <list | enable <channel> <event name>... | disable <event name>...>';
e.info = `Toggles logging for the specified events. Available events are:
- memberban - when a user gets banned
- memberunban - when a user gets unbanned
- memberjoin - when a user joins
- memberleave - when a user leaves
- messagedelete - when a message gets deleted
- messageupdate - when a message gets updated
- userupdate - when a user changes their username or avatar`;
e.longinfo = `<p>Toggles logging for the specified events. Available events are:</p>
<ul><li>memberban - when a user gets banned</li>
<li>memberunban - when a user gets unbanned</li>
<li>memberjoin - when a user joins</li>
<li>memberleave - when a user leaves</li>
<li>messagedelete - when a message gets deleted</li>
<li>messageupdate - when a message gets updated</li>
<li>userupdate - when a user changes their username or avatar</li>`;

var events = [
    'memberban',
    'memberunban',
    'memberjoin',
    'memberleave',
    'messagedelete',
    'messageupdate',
    'userupdate'
];

e.execute = async function (msg, words) {
    let storedGuild = await r.table('guild').get(msg.channel.guild.id);
    if (!storedGuild.hasOwnProperty('log')) storedGuild.log = {};
    logger.debug(words);
    if (words.length >= 2) {
        switch (words[1].toLowerCase()) {
            case 'list':
                let output = 'Currently logged events:\n';
                for (let event in storedGuild.log) {
                    output += `${event} - <#${storedGuild.log[event]}>\n`;
                }
                bu.send(msg, output);
                break;
            case 'enable':
                if (words.length >= 3) {
                    if (msg.channelMentions.length > 0) {
                        let channel = msg.channelMentions[0];
                        let args = words.slice(2);
                        for (let event of args) {
                            if (events.indexOf(event.toLowerCase()) > -1)
                                storedGuild.log[event.toLowerCase()] = channel;
                        }
                        await r.table('guild').get(msg.channel.guild.id).replace(storedGuild);
                        bu.send(msg, 'Done!');
                    } else {
                        bu.send(msg, `Usage: \`${e.usage}\`\n${e.info}`);
                    }
                } else {
                    bu.send(msg, `Usage: \`${e.usage}\`\n${e.info}`);
                }
                break;
            case 'disable':
                if (words.length >= 2) {
                    let args = words.slice(2);
                    logger.debug(storedGuild.log);
                    for (let event of args) {
                        storedGuild.log[event.toLowerCase()] = undefined;
                    }
                    logger.debug(storedGuild.log);
                    await r.table('guild').get(msg.channel.guild.id).replace(storedGuild);
                    bu.send(msg, 'Done!');
                } else {
                    bu.send(msg, `Usage: \`${e.usage}\`\n${e.info}`);
                }
                break;
            default:
                bu.send(msg, `Usage: \`${e.usage}\`\n${e.info}`);
                break;
        }
    } else {
        bu.send(msg, `Usage: \`${e.usage}\`\n${e.info}`);
    }
};