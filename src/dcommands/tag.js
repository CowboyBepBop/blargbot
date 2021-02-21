"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagCommand = void 0;
const command_1 = require("../core/command");
const utils_1 = require("../utils");
class TagCommand extends command_1.BaseCommand {
    constructor(cluster) {
        super(cluster, {
            name: 'tag',
            aliases: ['t'],
            category: utils_1.commandTypes.GENERAL,
            info: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n',
            handler: {
                parameters: '{tagName} {args*}',
                execute: () => '',
                subcommands: {
                    'create|add': {
                        parameters: '{tagName} {content*}',
                        execute: () => '',
                        description: ''
                    },
                    'edit': {
                        parameters: '{tagName} {content*}',
                        execute: () => '',
                        description: ''
                    },
                    'delete|remove': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'permdelete': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'set': {
                        parameters: '{tagName} {content*}',
                        execute: () => '',
                        description: ''
                    },
                    'rename': {
                        parameters: '{oldName} {newName}',
                        execute: () => '',
                        description: ''
                    },
                    'cooldown': {
                        parameters: '{tagName} {duration?:duration}',
                        execute: () => '',
                        description: ''
                    },
                    'raw': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'info': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'top': {
                        parameters: '',
                        execute: () => '',
                        description: ''
                    },
                    'author': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'search': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'list': {
                        parameters: '{author?}',
                        execute: () => '',
                        description: ''
                    },
                    'favourite|favorite': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'report': {
                        parameters: '{tagName} {reason+}',
                        execute: () => '',
                        description: ''
                    },
                    'test|eval|exec|vtest': {
                        parameters: 'debug? {code+}',
                        execute: () => '',
                        description: ''
                    },
                    'debug': {
                        parameters: '{tagName} {args*}',
                        execute: () => '',
                        description: ''
                    },
                    'flag': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: '',
                        subcommands: {
                            'create|add': {
                                parameters: '{tagName} {flags+}',
                                execute: () => '',
                                description: ''
                            },
                            'delete|remove': {
                                parameters: '{tagName} {flags+}',
                                execute: () => '',
                                description: ''
                            }
                        }
                    },
                    'setlang': {
                        parameters: '{tagName} {language}',
                        execute: () => '',
                        description: ''
                    }
                }
            }
        });
    }
}
exports.TagCommand = TagCommand;
//# sourceMappingURL=tag.js.map