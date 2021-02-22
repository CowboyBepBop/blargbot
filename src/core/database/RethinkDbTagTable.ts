import { RethinkDb } from './core/RethinkDb';
import { StoredTag, TagsTable } from './types';
import { RethinkDbTable } from './core/RethinkDbTable';
import { FlagDefinition } from '../../utils';

export class RethinkDbTagTable extends RethinkDbTable<'tag'> implements TagsTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: CatLogger
    ) {
        super('tag', rethinkDb, logger);
    }

    public async list(skip: number, take: number): Promise<readonly string[]> {
        return await this.rqueryAll(t =>
            t.orderBy({ index: 'name' })
                .getField('name')
                .skip(skip)
                .limit(take));
    }

    public async count(): Promise<number> {
        return await this.rquery(t => t.count());
    }

    public async byAuthor(userId: string, skip: number, take: number): Promise<readonly string[]> {
        return await this.rqueryAll(t =>
            t.getAll(userId, { index: 'author' })
                .orderBy({ index: 'name' })
                .getField('name')
                .skip(skip)
                .limit(take));
    }

    public async byAuthorCount(userId: string): Promise<number> {
        return await this.rquery(t =>
            t.getAll(userId, { index: 'author' })
                .count());
    }

    public async search(partialName: string, skip: number, take: number): Promise<readonly string[]> {
        const expr = partialName.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
        return await this.rqueryAll((t, r) =>
            t.orderBy({ index: 'name' })
                .filter(r.row<string>('name').match(`(?i)${expr}`))
                .getField('name')
                .skip(skip)
                .limit(take));
    }

    public async searchCount(partialName: string): Promise<number> {
        const expr = partialName.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
        return await this.rquery((t, r) =>
            t.filter(r.row<string>('name').match(`(?i)${expr}`))
                .count());
    }

    public async top(count: number): Promise<DeepReadOnly<StoredTag[]>> {
        return await this.rqueryAll((t, r) =>
            t.orderBy(r.desc('uses'))
                .limit(count));
    }

    public async get(tagName: string): Promise<DeepReadOnly<StoredTag> | undefined> {
        return await this.rget(tagName);
    }

    public async set(tag: StoredTag): Promise<boolean> {
        return await this.rset(tag.name, tag);
    }

    public async add(tag: StoredTag): Promise<boolean> {
        return await this.rinsert(tag);
    }

    public async delete(tagName: string): Promise<boolean> {
        return await this.rdelete(tagName);
    }

    public async disable(tagName: string, userId: string, reason: string): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            content: '',
            deleted: true,
            deleter: userId,
            reason: reason,
            uses: 0,
            favourites: r.literal({})
        }));
    }

    public async incrementUses(tagName: string, count = 1): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            uses: r.row<number>('uses').default(0).add(count),
            lastuse: new Date()
        }));
    }

    public async incrementReports(tagName: string, count = 1): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            reports: r.row<number>('reports').default(0).add(count)
        }));
    }

    public async setCooldown(tagName: string, cooldown: number | undefined): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            cooldown: r.literal(...(cooldown === undefined ? [] : [cooldown]))
        }));
    }
    public async getFavourites(userId: string): Promise<readonly string[]> {
        return await this.rqueryAll(t =>
            t.getAll(userId, { index: 'user_favourite' })
                .orderBy('name')
                .getField('name'));
    }

    public async setFavourite(tagName: string, userId: string, favourite: boolean): Promise<boolean> {
        return await this.rupdate(tagName, {
            favourites: {
                [userId]: favourite
            }
        });
    }

    public async setFlags(tagName: string, flags: FlagDefinition[]): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            flags: r.literal(flags)
        }));
    }

    public async setLanguage(tagName: string, language: string | undefined): Promise<boolean> {
        return await this.rupdate(tagName, r => ({
            lang: r.literal(...(location === undefined ? [] : [language]))
        }));
    }
}
