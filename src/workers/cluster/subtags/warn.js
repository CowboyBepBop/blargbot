/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:21:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:18:07
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const { modlogColours } = require('../newbu');

module.exports =
    Builder.BotTag('warn')
        .withArgs(a => [a.optional('user'), a.optional('count'), a.optional('reason')])
        .withDesc('Gives `user` the specified number of warnings with the given reason, and returns their new warning count. ' +
            '`user` defaults to the authorizer of the tag. `count` defaults to 1.')
        .withExample(
            'Be warned! {warn}',
            'Be warned! 1'
        )
        .whenArgs('0-3', async function (subtag, context, args) {
            let user = context.authorizer;
            let count = bu.parseInt(args[1] || 1);
            let reason = args[2];

            if (args[0])
                user = await context.getUser(args[0], {
                    suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (typeof user === 'number') {
                user = bot.users.get(user);
            }

            if (user == null)
                return Builder.errors.noUserFound(subtag, context);

            if (isNaN(count))
                return Builder.errors.notANumber(subtag, context);

            let result = await bu.issueWarning(user, context.guild, count);
            await bu.logAction(context.guild, user, undefined, 'Tag Warning', reason, modlogColours.WARN, [{
                name: 'Warnings',
                value: `Assigned: ${count}\nNew Total: ${result.count || 0}`,
                inline: true
            }]);
            return result.count;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
