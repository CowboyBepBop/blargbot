var e = module.exports = {};
var bu;
var exec = require('child_process').exec;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.CAT;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = (msg) => {
    if (msg.author.id === bu.CAT_ID) {
        exec('pm2 restart 0 --node-args="--harmony"');
    }
};