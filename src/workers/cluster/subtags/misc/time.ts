import { BaseSubtag, BBTagRuntimeError } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class TimeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'time',
            category: SubtagType.COMPLEX,
            desc: 'If you provide `time`, you should also provide `parseFormat` to ensure it is being interpreted correctly.\n' +
                'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more format information.\n' +
                'See [here](http://momentjs.com/docs/#/parsing/) for parsing documentation. ' +
                'See [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for a list of timezone codes.',
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: 'Returns `time` formatted using `format`.',
                    exampleIn: 'The current date is {time}',
                    exampleOut: 'The current date is {time}',
                    execute: (_, [format]) => this.showTime('now', format.value, '', 'Etc/UTC', 'Etc/UTC')
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'time', 'parseFormat?'],
                    description: 'Returns `time` formatted using `format`.',
                    exampleIn: '{time;YYYY/MM/DD HH:mm:ss;{time;X};X}',
                    exampleOut: '2021-08-12T11:55:42Z',
                    execute: (_, [format, time, parseFormat]) => this.showTime(time.value, format.value, parseFormat.value, 'Etc/UTC', 'Etc/UTC')
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'time', 'parseFormat', 'fromTimezone:Etc/UTC'],
                    description: 'Returns `time` formatted using `format`.' +
                        'If `time` is empty, the current time in `fromTimezone` will be returned.',
                    exampleCode: 'Time Berlin (as fromTimezone): {time;HH:mm;;;Europe/Berlin}',
                    exampleOut: 'Time Berlin (as fromTimezone): 23:33',
                    execute: (_, [format, time, parseFormat, fromTimezone]) => this.showTime(time.value, format.value, parseFormat.value, fromTimezone.value, 'Etc/UTC')
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'time', 'parseFormat', 'fromTimezone', 'toTimezone:Etc/UTC'],
                    description: '`time` is in `fromTimezone` and converted to `toTimezone` using `format`.',
                    exampleCode: 'Time Berlin (as toTimezone): {time;HH:mm;;;;Europe/Berlin}\n' +
                        'Time Berlin from UTC 12:00: {time;HH:mm;12:00;HH:mm;;Europe/Berlin}\n' +
                        'Time Berlin (as fromTimezone): {time;HH:mm;;;Europe/Berlin}\n' +
                        'Time Berlin (as fromTimezone and empty toTimezone): {time;HH:mm;;;Europe/Berlin;}\n' +
                        'Time New York from Berlin (12:00 in Berlin): {time;HH:mm;12:00;HH:mm;Europe/Berlin;America/New_York}',
                    exampleOut: 'Time Berlin (as toTimezone): 23:33\n' +
                        'Time Berlin from UTC 12:00: 14:00\n' +
                        'Time Berlin (as fromTimezone): 23:33\n' +
                        'Time Berlin (as fromTimezone and empty toTimezone): 21:33\n' +
                        'Time New York from Berlin (12:00 in Berlin): 06:00',
                    execute: (_, [format, time, parseFormat, fromTimezone, toTimezone]) => this.showTime(time.value, format.value, parseFormat.value, fromTimezone.value, toTimezone.value)
                }
            ]
        });
    }

    public showTime(timeStr: string, format: string, parseFormat: string, fromTimezone: string, toTimezone: string): string {
        const time = parse.time(timeStr === '' ? 'now' : timeStr, parseFormat, fromTimezone, toTimezone);
        if (!time.isValid())
            throw new BBTagRuntimeError('Invalid date');
        return time.format(format);
    }
}
