import { AnyMessage, Client as ErisClient, User } from 'eris';
import { Duration, Moment } from 'moment-timezone';
import { FlagDefinition, MessageFilter, SubtagVariableType } from '../../utils';
import { Options as SequelizeOptions } from 'sequelize';

export type RethinkTableMap = {
    'guild': StoredGuild;
    'tag': StoredTag;
    'user': StoredUser;
    'vars': KnownStoredVars;
    'events': Omit<StoredEvent, 'id'>
}

export interface StoredVar<T extends string> {
    readonly varname: T;
}

export interface RestartStoredVar extends StoredVar<'restart'> {
    readonly varvalue: {
        readonly channel: string;
        readonly time: number;
    };
}

export interface TagVarsStoredVar extends StoredVar<'tagVars'> {
    readonly values: { readonly [key: string]: unknown } | null;
}

export interface ARWhitelistStoredVar extends StoredVar<'arwhitelist'> {
    readonly values: readonly string[];
}

export interface GuildBlacklistStoredVar extends StoredVar<'guildBlacklist'> {
    readonly values: { readonly [guildid: string]: boolean | undefined };
}

export interface BlacklistStoredVar extends StoredVar<'blacklist'> {
    readonly users: readonly string[];
    readonly guilds: readonly string[];
}

export interface WhitelistedDomainsStoredVar extends StoredVar<'whitelistedDomains'> {
    readonly values: { readonly [domain: string]: boolean };
}

export interface ChangelogStoredVar extends StoredVar<'changelog'> {
    readonly guilds: { readonly [guildid: string]: string };
}

export interface PGStoredVar extends StoredVar<'pg'> {
    readonly value: number;
}

export interface PoliceStoredVar extends StoredVar<'police'> {
    readonly value: readonly string[];
}

export interface SupportStoredVar extends StoredVar<'support'> {
    readonly value: readonly string[];
}

export interface CleverStatsStoredVar extends StoredVar<'cleverstats'> {
    readonly stats: { readonly [date: string]: { readonly uses: number } };
}

export interface VersionStoredVar extends StoredVar<'version'> {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
}

export type KnownStoredVars =
    | RestartStoredVar
    | TagVarsStoredVar
    | ARWhitelistStoredVar
    | GuildBlacklistStoredVar
    | BlacklistStoredVar
    | WhitelistedDomainsStoredVar
    | ChangelogStoredVar
    | PGStoredVar
    | PoliceStoredVar
    | SupportStoredVar
    | VersionStoredVar
    | CleverStatsStoredVar

export type MutableKnownStoredVars =
    | RestartStoredVar
    | TagVarsStoredVar
    | ARWhitelistStoredVar
    | GuildBlacklistStoredVar
    | BlacklistStoredVar
    | WhitelistedDomainsStoredVar
    | ChangelogStoredVar
    | PGStoredVar
    | PoliceStoredVar
    | SupportStoredVar
    | VersionStoredVar
    | CleverStatsStoredVar

export type GetStoredVar<T extends KnownStoredVars['varname']> = Extract<KnownStoredVars, { varname: T }>;

export interface StoredEvent {
    readonly id: string;
    readonly type: string;
    readonly endtime: Date;
    readonly source?: string;
    readonly channel?: string;
    readonly guild?: string;
    readonly user?: string;
}

export interface StoredGuild {
    readonly guildid: string;
    readonly active: boolean;
    readonly name: string;
    readonly settings: StoredGuildSettings;
    readonly channels: { readonly [channelId: string]: ChannelSettings | undefined };
    readonly ccommands: { readonly [key: string]: StoredGuildCommand | undefined };
    readonly commandperms?: { readonly [key: string]: CommandPermissions | undefined };
    readonly censor?: GuildCensors;
    readonly warnings?: GuildWarnings;
    readonly modlog?: readonly GuildModlogEntry[];
    readonly roleme?: readonly GuildRolemeEntry[];
    readonly autoresponse?: GuildAutoresponses;
    readonly log?: { readonly [key: string]: string };
    readonly logIgnore?: readonly string[];
}

export interface MutableStoredGuild extends StoredGuild {
    ccommands: { [key: string]: StoredGuildCommand | undefined };
    warnings?: MutableGuildWarnings;
    modlog?: GuildModlogEntry[];
    log?: { [key: string]: string };
}

export interface GuildAutoresponses {
    readonly everything?: GuildAutoresponse;
    readonly list?: readonly GuildFilteredAutoresponse[];
}

export interface GuildAutoresponse {
    readonly executes: string;
}

export interface GuildFilteredAutoresponse extends GuildAutoresponse, MessageFilter {
}

export interface GuildRolemeEntry {
    readonly channels: readonly string[];
    readonly casesensitive: boolean;
    readonly message: string;
    readonly add?: readonly string[];
    readonly remove?: readonly string[];
    readonly output?: string;
}

export interface GuildWarnings {
    readonly users?: { readonly [userId: string]: number | undefined };
}
export interface MutableGuildWarnings {
    users?: { [userId: string]: number | undefined };
}

export interface GuildCensors {
    readonly list: readonly GuildCensor[]
    readonly exception: GuildCensorExceptions;
    readonly rule: GuildCensorRule;
}

export interface GuildCensorRule {
    readonly deleteMessage?: string;
    readonly banMessage?: string;
    readonly kickMessage?: string;
}

export interface GuildCensor extends GuildCensorRule, MessageFilter {
    readonly weight: number;
    readonly reason?: string;
}

export interface GuildCensorExceptions {
    readonly channel: string | readonly string[];
    readonly user: string | readonly string[];
    readonly role: string | readonly string[];
}

export interface NamedStoredGuildCommand extends StoredGuildCommand {
    readonly name: string;
}

export interface StoredGuildCommand {
    readonly help?: string;
    readonly lang?: string;
    readonly alias?: string;
    readonly authorizer?: string;
    readonly content: string;
    readonly author?: string;
    readonly hidden?: boolean;
    readonly roles?: readonly string[];
    readonly uses?: number;
    readonly flags?: readonly FlagDefinition[];
    readonly cooldown?: number;
}

export interface CommandPermissions {
    readonly disabled?: boolean;
    readonly permission?: number;
    readonly rolename?: string | readonly string[];
}

export interface StoredTag {
    readonly name: string;
    readonly content: string;
    readonly author: string;
    readonly authorizer?: string;
    readonly uses: number;
    readonly flags?: readonly FlagDefinition[]
    readonly cooldown?: number;
    readonly lastuse?: Date;
    readonly lastmodified: Date;
    readonly deleted?: boolean;
    readonly lang?: string;
    readonly deleter?: string;
    readonly reason?: string;
    readonly favourites?: { readonly [key: string]: boolean | undefined };
    readonly reports?: number;
}

export interface StoredGuildSettings {
    readonly permoverride?: boolean;
    readonly staffperms?: number | string;
    readonly social?: boolean;
    readonly makelogs?: boolean;
    readonly prefix?: readonly string[] | string;
    readonly nocleverbot?: boolean;
    readonly tableflip?: boolean;
    readonly disablenoperms?: boolean;
    readonly adminrole?: string;
    readonly antimention?: number;
    readonly banat?: number;
    readonly kickat?: number;
    readonly modlog?: string;
    readonly deletenotif?: boolean;
    readonly disableeveryone?: boolean;
    readonly greeting?: string;
    readonly greetChan?: string;
    readonly farewell?: string;
    readonly farewellchan?: string;
    readonly mutedrole?: string;
    readonly dmhelp?: boolean;
    readonly kickoverride?: number;
    readonly banoverride?: number;
}

export interface GuildModlogEntry {
    readonly caseid?: number;
    readonly modid?: string;
    readonly msgid?: string;
    readonly reason?: string;
    readonly type?: string;
    readonly userid?: string;
}

export interface ChannelSettings {
    readonly blacklisted?: boolean;
    readonly nsfw?: boolean;
}

export interface StoredUsername {
    readonly name: string,
    readonly date: Date
}

export interface StoredUser extends StoredUserSettings {
    readonly userid: string;
    readonly username?: string;
    readonly usernames: readonly StoredUsername[];
    readonly discriminator?: string;
    readonly avatarURL?: string;
    readonly isbot: boolean;
    readonly lastspoke: Date;
    readonly lastcommand?: string;
    readonly lastcommanddate?: Date;
    readonly todo: readonly UserTodo[];
    readonly reportblock?: string;
    readonly reports?: { readonly [key: string]: string };
}

export interface MutableStoredUser extends StoredUser {
    usernames: StoredUsername[];
    username?: string;
    discriminator?: string;
    avatarURL?: string;
    reports?: { [key: string]: string };
}

export interface StoredUserSettings {
    readonly dontdmerrors?: boolean;
    readonly prefixes?: readonly string[];
    readonly blacklisted?: boolean;
}

export interface UserTodo {
    readonly active: 1 | false;
    readonly content: string;
}

export interface Dump {
    readonly id: string;
    readonly content?: string;
    readonly embeds?: string;
    readonly channelid?: string;
}

export const enum ChatlogType {
    CREATE = 0,
    UPDATE = 1,
    DELETE = 2
}

export interface Chatlog {
    readonly id: Snowflake;
    readonly content: string;
    readonly attachment?: string;
    readonly userid: string;
    readonly msgid: string;
    readonly channelid: string;
    readonly guildid: string;
    readonly msgtime: number | Date;
    readonly type: ChatlogType;
    readonly embeds: string | JObject;
}

export interface BBTagVariableReference {
    readonly name: string;
    readonly type: SubtagVariableType;
    readonly scope: string;

}

export interface BBTagVariable extends BBTagVariableReference {
    readonly value: JToken;
}

export interface DatabaseOptions {
    readonly logger: CatLogger;
    readonly discord: ErisClient;
    readonly rethinkDb: RethinkDbOptions;
    readonly cassandra: CassandraDbOptions;
    readonly postgres: PostgresDbOptions;
}

export interface RethinkDbOptions {
    readonly database: string;
    readonly user: string;
    readonly password: string;
    readonly host: string;
    readonly port: number;
}

export interface CassandraDbOptions {
    readonly username: string;
    readonly password: string;
    readonly keyspace: string;
    readonly contactPoints: readonly string[];
}

export interface PostgresDbOptions {
    readonly database: string;
    readonly user: string;
    readonly pass: string;
    readonly host: string;
    readonly sequelize: SequelizeOptions;
}

export interface GuildTable {
    getAutoresponses(guildId: string, skipCache?: boolean): Promise<GuildAutoresponses>;
    getChannelSetting<K extends keyof ChannelSettings>(guildId: string, channelId: string, key: K, skipCache?: boolean): Promise<ChannelSettings[K] | undefined>;
    getRolemes(guildId: string, skipCache?: boolean): Promise<readonly GuildRolemeEntry[]>;
    getCensors(guildId: string, skipCache?: boolean): Promise<GuildCensors | undefined>;
    listCommands(guildId: string, skipCache?: boolean): Promise<readonly NamedStoredGuildCommand[]>;
    get(guildId: string, skipCache?: boolean): Promise<StoredGuild | undefined>;
    add(guild: StoredGuild): Promise<boolean>;
    getIds(skipCache?: boolean): Promise<readonly string[]>;
    getSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, skipCache?: boolean): Promise<StoredGuildSettings[K] | undefined>;
    setSetting<K extends keyof StoredGuildSettings>(guildId: string, key: K, value: StoredGuildSettings[K]): Promise<boolean>;
    getCommand(guildId: string, commandName: string, skipCache?: boolean): Promise<StoredGuildCommand | undefined>;
    withIntervalCommand(skipCache?: boolean): Promise<readonly StoredGuild[] | undefined>;
    updateCommand(guildId: string, commandName: string, command: Partial<StoredGuildCommand>): Promise<boolean>;
    setCommand(guildId: string, commandName: string, command: StoredGuildCommand | undefined): Promise<boolean>;
    renameCommand(guildId: string, oldName: string, newName: string): Promise<boolean>;
    addModlog(guildId: string, modlog: GuildModlogEntry): Promise<boolean>;
    setLogChannel(guildId: string, event: string, channel: string | undefined): Promise<boolean>;
    setWarnings(guildId: string, userId: string, count: number | undefined): Promise<boolean>;
    getCommandPerms(guildId: string, commandName: string, skipCache?: boolean): Promise<CommandPermissions | undefined>;
}

export interface UserTable {
    getSetting<K extends keyof StoredUserSettings>(userId: string, key: K, skipCache?: boolean): Promise<StoredUserSettings[K] | undefined>;
    get(userId: string, skipCache?: boolean): Promise<StoredUser | undefined>;
    add(user: StoredUser): Promise<boolean>;
    upsert(user: User): Promise<boolean>
    setTagReport(userId: string, tagName: string, reason: string | undefined): Promise<boolean>;
}

export interface VarsTable {
    get<K extends KnownStoredVars['varname']>(key: K): Promise<GetStoredVar<K> | undefined>;
    set<K extends KnownStoredVars['varname']>(value: GetStoredVar<K>): Promise<boolean>;
    delete<K extends KnownStoredVars['varname']>(key: K): Promise<boolean>;
}

export interface EventsTable {
    between(from: Date | Moment | number, to: Date | Moment | number): Promise<StoredEvent[]>;
    add(event: Omit<StoredEvent, 'id'>): Promise<boolean>;
    delete(eventId: string): Promise<boolean>;
    delete(filter: Partial<StoredEvent>): Promise<boolean>;
}

export interface TagsTable {
    setLanguage(tagName: string, language: string | undefined): Promise<boolean>;
    list(skip: number, take: number): Promise<readonly string[]>;
    count(): Promise<number>;
    byAuthor(userId: string, skip: number, take: number): Promise<readonly string[]>;
    byAuthorCount(userId: string): Promise<number>;
    search(partialName: string, skip: number, take: number): Promise<readonly string[]>;
    searchCount(partialName: string): Promise<number>;
    delete(name: string): Promise<boolean>;
    disable(tagName: string, userId: string, reason: string): Promise<boolean>;
    top(count: number): Promise<readonly StoredTag[]>;
    get(tagName: string): Promise<StoredTag | undefined>;
    set(tag: StoredTag): Promise<boolean>;
    add(tag: StoredTag): Promise<boolean>;
    setFlags(tagName: string, flags: readonly FlagDefinition[]): Promise<boolean>;
    incrementUses(tagName: string, count?: number): Promise<boolean>;
    incrementReports(tagName: string, count?: number): Promise<boolean>;
    setCooldown(tagName: string, cooldown: number | undefined): Promise<boolean>;
    getFavourites(userId: string): Promise<readonly string[]>;
    setFavourite(tagName: string, userId: string, favourite: boolean): Promise<boolean>;
}

export interface ChatlogsTable {
    add(message: AnyMessage, type: ChatlogType, lifespan?: number | Duration): Promise<void>;
    get(messageId: string): Promise<Chatlog | undefined>;
}

export interface DumpsTable {
    add(dump: Dump, lifespan?: number | Duration): Promise<void>;
}

export interface TagVariablesTable {
    upsert(values: Record<string, JToken>, type: SubtagVariableType, scope: string): Promise<void>;
    get(name: string, type: SubtagVariableType, scope: string): Promise<JToken>;
}