/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:21:16
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:21:16
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

bot.on('guildBanRemove', async function (guild, user) {
    let storedGuild = await bu.getGuild(guild.id);
    let modlog = storedGuild.modlog || [];
    let lastCase = modlog[modlog.length - 1];
    let mod, reason, type;
    if (bu.unbans[guild.id] && bu.unbans[guild.id][user.id]) {
        mod = bot.users.get(bu.unbans[guild.id][user.id].mod);
        reason = bu.unbans[guild.id][user.id].reason;
        type = bu.unbans[guild.id][user.id].type;
        delete bu.unbans[guild.id][user.id];
    }
    if (lastCase && lastCase.userid == user.id) {
        let val = await bu.guildSettings.get(guild.id, 'modlog');

        let msg2 = await bot.getMessage(val, lastCase.msgid);
        let embed = msg2.embeds[0];

        if (embed && (Date.now() - Date.now() - dep.moment(embed.timestamp).format('x')) <= 60000) {
            embed.fields[0].value = 'Softban';
            embed.color = bu.ModLogColour.SOFTBAN;
            embed.timestamp = dep.moment(embed.timestamp);

            msg2.edit({
                content: ' ',
                embed: embed
            });
        } else {
            bu.logAction(guild, user, mod, type || 'Unban', reason, bu.ModLogColour.UNBAN);
        }
    } else {
        bu.logAction(guild, user, mod, type || 'Unban', reason, bu.ModLogColour.UNBAN);
    }
    bu.logEvent(guild.id, user.id, 'memberunban', [{
        name: 'User',
        value: bu.getFullName(user) + ` (${user.id})`,
        inline: true
    }]);
    r.table('events').filter({ user: user.id, type: 'unban', source: guild.id }).delete().run();
});