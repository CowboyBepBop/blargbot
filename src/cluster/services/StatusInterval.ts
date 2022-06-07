import { CronService } from '@blargbot/core/serviceTypes';
import { ActivityPartial, BotActivityType, Constants } from 'eris';
import moment from 'moment-timezone';

import { Cluster } from '../Cluster';
import { ClusterOptions } from '../types';

export class StatusInterval extends CronService {
    public readonly holidays: Record<string, string | undefined>;
    public readonly type = 'discord';

    public constructor(
        public readonly cluster: Cluster,
        { holidays }: ClusterOptions
    ) {
        super({ cronTime: '*/15 * * * *' }, cluster.logger);
        this.holidays = holidays;
    }

    public execute(): void {
        this.logger.info('!=! Performing the status interval !=!');
        const date = moment().format('MM-DD');
        const cronId = Math.round(moment().valueOf() / moment.duration(15, 'minutes').asMilliseconds());
        const holiday = this.holidays[date];
        const status = holiday === undefined ? games[(1103515245 * cronId + 12345) % games.length] : { type: Constants.ActivityTypes.GAME, name: holiday };
        this.cluster.discord.editStatus('online', [status]);
    }

    public start(): void {
        super.start();
        this.execute();
    }
}

const games: Array<ActivityPartial<BotActivityType>> = [
    { type: Constants.ActivityTypes.GAME, name: 'with tiny bits of string!' },
    { type: Constants.ActivityTypes.GAME, name: 'with a mouse!' },
    { type: Constants.ActivityTypes.GAME, name: 'with a laser pointer!' },
    { type: Constants.ActivityTypes.GAME, name: 'with a ball of yarn!' },
    { type: Constants.ActivityTypes.GAME, name: 'in a box!' },
    { type: Constants.ActivityTypes.LISTENING, name: 'to the pitter-patter of tiny feet.' }
];
