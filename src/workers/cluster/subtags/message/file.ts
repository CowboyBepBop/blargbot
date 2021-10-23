import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class FileSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'file',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['file', 'filename'],
                    description: 'Sets the output attachment to the provided `file` and `filename`. If `file` starts with `buffer:`, the following text will be parsed as base64 to a raw buffer - useful for uploading images.',
                    exampleCode: '{file;Hello, world!;readme.txt}',
                    exampleOut: '(a file labeled readme.txt containing "Hello, world!")',
                    execute: (ctx, [file, fileName]) => this.attachFile(ctx, file.value, fileName.value)
                }
            ]
        });
    }

    public attachFile(context: BBTagContext, content: string, fileName: string): undefined {
        context.state.file = { attachment: content, name: fileName };
        if (content.startsWith('buffer:'))
            context.state.file.attachment = Buffer.from(content.substring(7), 'base64');
        return undefined;
    }
}
