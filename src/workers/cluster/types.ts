import { BBTagContext, limits, ScopeManager, SubtagCallStack, TagCooldownManager, VariableCache } from '@cluster/bbtag';
import { BaseCommand, CommandContext, ScopedCommandBase } from '@cluster/command';
import { CommandType, ModerationType, SubtagType } from '@cluster/utils';
import { CommandPermissions, EvalRequest, EvalResult, GlobalEvalResult, GuildSourceCommandTag, IMiddleware, MasterEvalRequest, NamedGuildCommandTag, SendPayload, StoredGuildSettings, StoredTag } from '@core/types';
import { ImageResult } from '@image/types';
import { Snowflake } from 'catflake';
import { Collection, ConstantsStatus, EmojiIdentifierResolvable, FileOptions, Guild, GuildMember, GuildTextBasedChannels, KnownChannel, Message, MessageAttachment, MessageEmbed, MessageEmbedOptions, MessageReaction, PartialMessageReaction, PrivateTextBasedChannels, Role, TextBasedChannels, User, Webhook } from 'discord.js';
import { Duration } from 'moment-timezone';
import { metric } from 'prom-client';
import ReadWriteLock from 'rwlock';

import { BBTagRuntimeError } from './bbtag/errors';
import { ClusterUtilities } from './ClusterUtilities';
import { ClusterWorker } from './ClusterWorker';

export type ClusterIPCContract = {
    'shardReady': { masterGets: number; workerGets: never; };
    'meval': { masterGets: MasterEvalRequest; workerGets: GlobalEvalResult | EvalResult; };
    'killshard': { masterGets: never; workerGets: number; };
    'ceval': { masterGets: EvalResult; workerGets: EvalRequest; };
    'getSubtagList': { masterGets: SubtagListResult; workerGets: undefined; };
    'getSubtag': { masterGets: SubtagDetails | undefined; workerGets: string; };
    'getGuildPermissionList': { masterGets: GuildPermissionDetails[]; workerGets: { userId: string; }; };
    'getGuildPermission': { masterGets: GuildPermissionDetails | undefined; workerGets: { userId: string; guildId: string; }; };
    'respawn': { masterGets: { id?: number; channel: string; }; workerGets: boolean; };
    'respawnApi': { masterGets: undefined; workerGets: boolean; };
    'respawnAll': { masterGets: { channelId: string; }; workerGets: boolean; };
    'killAll': { masterGets: undefined; workerGets: undefined; };
    'clusterStats': { masterGets: ClusterStats; workerGets: never; };
    'getClusterStats': { masterGets: undefined; workerGets: Record<number, ClusterStats | undefined>; };
    'getCommandList': { masterGets: CommandListResult; workerGets: undefined; };
    'getCommand': { masterGets: ICommandDetails | undefined; workerGets: string; };
    'metrics': { masterGets: metric[]; workerGets: undefined; };
}

export interface ICommandManager<T = unknown> {
    readonly size: number;
    get(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetResult<T>>;
    list(location?: Guild | TextBasedChannels, user?: User): AsyncIterable<ICommand<T>>;
    configure(user: User, names: readonly string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]>;
    load(commands?: Iterable<string> | boolean): Promise<void>;
}

export interface ICommandDetails extends Required<CommandPermissions> {
    readonly name: string;
    readonly aliases: readonly string[];
    readonly category: string;
    readonly description: string | undefined;
    readonly flags: readonly FlagDefinition[];
    readonly signatures: readonly CommandSignature[];
}

export interface ICommand<T = unknown> extends ICommandDetails, IMiddleware<CommandContext, CommandResult> {
    readonly name: string;
    readonly implementation: T;
}

export type Result<State, Detail = undefined, Optional extends boolean = Detail extends undefined ? true : false> = Optional extends false
    ? { readonly state: State; readonly detail: Detail; }
    : { readonly state: State; readonly detail?: Detail; };

export type PermissionCheckResult =
    | Result<'ALLOWED'>
    | Result<'BLACKLISTED', string>
    | Result<'DISABLED'>
    | Result<'NOT_IN_GUILD'>
    | Result<'MISSING_ROLE', readonly string[]>
    | Result<'MISSING_PERMISSIONS', bigint>;

export type CommandGetResult<T = unknown> =
    | Result<'NOT_FOUND'>
    | Exclude<PermissionCheckResult, { state: 'ALLOWED'; }>
    | Result<'ALLOWED', ICommand<T>>;

export type CommandGetCoreResult<T = unknown> =
    | CommandGetResult<T>
    | Result<'FOUND', ICommand<T>>;

export type CommandManagerTypeMap = {
    custom: NamedGuildCommandTag;
    default: BaseCommand;
};

export type CommandManagers = { [P in keyof CommandManagerTypeMap]: ICommandManager<CommandManagerTypeMap[P]> }

export interface Statement extends ReadonlyArray<string | SubtagCall> {
    readonly source: string;
    readonly start: SourceMarker;
    readonly end: SourceMarker;
}

export interface AnalysisResults {
    readonly errors: AnalysisResult[];
    readonly warnings: AnalysisResult[];
}

export interface AnalysisResult {
    readonly location: SourceMarker;
    readonly message: string;
}

export interface SubtagCall {
    readonly name: Statement;
    readonly args: readonly Statement[];
    readonly start: SourceMarker;
    readonly end: SourceMarker;
    readonly source: string;
}

export const enum SourceTokenType {
    CONTENT,
    STARTSUBTAG,
    ENDSUBTAG,
    ARGUMENTDELIMITER
}

export interface SourceMarker {
    readonly index: number;
    readonly line: number;
    readonly column: number;
}
export interface BBTagArray { // TODO BBTagRef
    v: JArray;
    n: string;
}

export interface BBTagRef<T> {
    readonly name: string;
    value: T;
}

export type BBTagMaybeRef<T> = {
    readonly name?: string;
    value: T;
};

export interface SourceToken {
    type: SourceTokenType;
    content: string;
    start: SourceMarker;
    end: SourceMarker;
}

export interface BBTagRuntimeScope {
    // Everything here should be immutable types.
    // Mutable types will modify globally when editing a local scope if not careful

    quiet?: boolean;
    fallback?: string;
    noLookupErrors?: boolean;
    reason?: string;
    inLock: boolean;
    paramsarray?: readonly string[];
    reaction?: string;
    reactUser?: string;

    // Functions are intended to be stored globally so a mutable type is fine
    readonly functions: Record<string, Statement | undefined>;
}
export interface SerializedRuntimeLimit {
    type: keyof typeof limits;
    rules: { [key: string]: JToken[]; };
}

export interface SerializedBBTagContext {
    msg: {
        id: string;
        timestamp: number;
        content: string;
        channel: { id: string; serialized: string; };
        member: { id: string; serialized: string; };
        attachments: Array<{
            id: string;
            name: string;
            url: string;
        }>;
        embeds: MessageEmbedOptions[];
    };
    isCC: boolean;
    state: Omit<BBTagContextState, 'cache' | 'overrides'>;
    scope: BBTagRuntimeScope;
    inputRaw: string;
    flags: readonly FlagDefinition[];
    tagName: string;
    rootTagName: string;
    author: string;
    authorizer: string;
    tagVars: boolean;
    tempVars: JObject;
    limit: SerializedRuntimeLimit;
}

export interface BBTagContextMessage {
    id: string;
    createdTimestamp: number;
    content: string;
    channel: GuildTextBasedChannels;
    member: GuildMember;
    author: User;
    attachments: Collection<Snowflake, MessageAttachment>;
    embeds: MessageEmbed[];
}

export interface BBTagContextState {
    query: {
        count: number;
        user: Record<string, string | undefined>;
        role: Record<string, string | undefined>;
        channel: Record<string, string | undefined>;
    };
    outputMessage: Promise<string | undefined> | undefined;
    ownedMsgs: string[];
    return: RuntimeReturnState;
    stackSize: number;
    embeds: undefined | MessageEmbedOptions[];
    file: undefined | FileOptions;
    reactions: string[];
    nsfw: undefined | string;
    replace: undefined | { regex: RegExp | string; with: string; };
    break: number;
    continue: number;
    subtags: Record<string, number[] | undefined>;
    cache: Record<string, NamedGuildCommandTag | StoredTag | null>;
    subtagCount: number;
    allowedMentions: {
        users: string[];
        roles: string[];
        everybody: boolean;
    };

}

export interface LocatedRuntimeError {
    readonly subtag: SubtagCall | undefined;
    readonly error: BBTagRuntimeError;
}

export interface RuntimeDebugEntry {
    subtag: SubtagCall;
    text: string;
}

export interface RuntimeLimit {
    addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this;
    readonly scopeName: string;
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    rulesFor(subtagName: string): string[];
    serialize(): SerializedRuntimeLimit;
    load(state: SerializedRuntimeLimit): void;
}

export const enum RuntimeReturnState {
    NONE = 0,
    CURRENTTAG = 1,
    ALL = -1
}

export interface BBTagContextOptions {
    readonly message: BBTagContextMessage;
    readonly inputRaw: string;
    readonly flags?: readonly FlagDefinition[];
    readonly isCC: boolean;
    readonly tagVars?: boolean;
    readonly author: string;
    readonly authorizer?: string;
    readonly rootTagName?: string;
    readonly tagName?: string;
    readonly cooldown?: number;
    readonly cooldowns?: TagCooldownManager;
    readonly locks?: Record<string, ReadWriteLock | undefined>;
    readonly limit: RuntimeLimit | keyof typeof import('./bbtag/limits')['limits'];
    readonly silent?: boolean;
    readonly state?: Partial<BBTagContextState>;
    readonly scopes?: ScopeManager;
    readonly variables?: VariableCache;
    readonly callStack?: SubtagCallStack;
}

export interface ExecutionResult {
    source: string;
    tagName: string;
    input: string;
    content: string;
    errors: LocatedRuntimeError[];
    debug: RuntimeDebugEntry[];
    duration: {
        total: number;
        database: number;
        active: number;
        subtag: Record<string, number[] | undefined>;
    };
    database: {
        committed: number;
        values: JObject;
    };
}
export interface SubtagHandlerCallSignature extends SubtagSignatureDetails {
    readonly implementation: SubtagLogic<SubtagResult>;
}

export type SubtagResult = AsyncIterable<string | undefined>;

export interface SubtagLogic<T> {
    execute(context: BBTagContext, args: SubtagArgumentArray, call: SubtagCall): T;
}

export interface CompositeSubtagHandler extends SubtagHandler {
    readonly handlers: readonly ConditionalSubtagHandler[];
}

export interface ConditionalSubtagHandler extends SubtagHandler {
    canHandle(call: SubtagCall): boolean;
}

export interface SubtagHandler {
    execute(context: BBTagContext, subtagName: string, call: SubtagCall): SubtagResult;
}

export type SubtagHandlerValueParameter =
    | OptionalSubtagHandlerParameter
    | RequiredSubtagHandlerParameter

export type SubtagHandlerParameter =
    | SubtagHandlerValueParameter
    | SubtagHandlerParameterGroup

export interface OptionalSubtagHandlerParameter {
    readonly name: string;
    readonly required: false;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly maxLength: number;
}

export interface RequiredSubtagHandlerParameter {
    readonly name: string;
    readonly required: true;
    readonly autoResolve: boolean;
    readonly defaultValue: string;
    readonly maxLength: number;
}

export interface SubtagHandlerParameterGroup {
    readonly minRepeats: number;
    readonly nested: readonly RequiredSubtagHandlerParameter[];
}

export interface SubtagSignatureDetails<TArgs = SubtagHandlerParameter> {
    readonly parameters: readonly TArgs[];
    readonly description?: string;
    readonly exampleCode?: string;
    readonly exampleIn?: string;
    readonly exampleOut?: string;
    readonly returns: keyof SubtagReturnTypeMap;
}

interface SubtagHandlerDefinition<Type extends keyof SubtagReturnTypeMap>
    extends SubtagSignatureDetails<string | SubtagHandlerDefinitionParameterGroup>,
    SubtagLogic<Awaitable<SubtagReturnTypeMap[Type]>> {
    readonly returns: Type;
}

type Iterated<T> = (Iterable<T> | AsyncIterable<T>); // To exclude string

export type SubtagReturnTypeMap = {
    'unknown': SubtagResult;
    'hex': number;
    'number': number | bigint;
    'number[]': Iterated<number>;
    'boolean': boolean;
    'boolean|number': boolean | number | bigint;
    'boolean[]': Iterated<boolean>;
    'string': string;
    'string|nothing': string | undefined;
    'string[]': Iterated<string>;
    '(string|error)[]': Iterated<string>;
    'id': string;
    'id[]': Iterated<string>;
    'json': JToken;
    'json|nothing': JToken | undefined;
    'json[]': Iterated<JToken>;
    'json[]|nothing': Iterated<JToken> | undefined;
    'nothing': void;
    'error': never;
    'loop': Iterated<string>;
}

export type AnySubtagHandlerDefinition = { [P in keyof SubtagReturnTypeMap]: SubtagHandlerDefinition<P> }[keyof SubtagReturnTypeMap];

export interface SubtagHandlerDefinitionParameterGroup {
    readonly minCount?: number;
    readonly repeat: readonly string[];
}

export interface FlagDefinition {
    readonly flag: Letter;
    readonly word: string;
    readonly description: string;
}

export interface FlagResultValue {
    get value(): string;
    get raw(): string;
}

export interface FlagResultValueSet {
    merge(start?: number, end?: number): FlagResultValue;
    length: number;
    get(index: number): FlagResultValue | undefined;
    slice(start: number, end?: number): FlagResultValueSet;
    map<T>(mapFn: (value: FlagResultValue) => T): T[];
    toArray(): FlagResultValue[];
}

export type FlagResultBase = { readonly [P in Letter | '_']?: FlagResultValueSet }
export interface FlagResult extends FlagResultBase {
    readonly _: FlagResultValueSet;
}

export interface CommandOptionsBase {
    readonly name: string;
    readonly aliases?: readonly string[];
    readonly category: CommandType;
    readonly cannotDisable?: boolean;
    readonly description?: string;
    readonly flags?: readonly FlagDefinition[];
    readonly hidden?: boolean;
}

export interface CommandBaseOptions extends CommandOptionsBase {
    readonly signatures: readonly CommandSignature[];
}

export interface CommandOptions<TContext extends CommandContext> extends CommandOptionsBase {
    readonly definitions: ReadonlyArray<CommandDefinition<TContext>>;
}

export type CommandResult =
    | ImageResult
    | SendPayload
    | undefined;

export type CommandDefinition<TContext extends CommandContext> =
    | CommandHandlerDefinition<TContext>
    | SubcommandDefinitionHolder<TContext>
    | CommandHandlerDefinition<TContext> & SubcommandDefinitionHolder<TContext>;

export type CommandParameter =
    | CommandSingleParameter<keyof CommandVariableTypeMap, boolean>
    | CommandGreedyParameter<keyof CommandVariableTypeMap>
    | CommandLiteralParameter;

export interface CommandHandlerDefinition<TContext extends CommandContext> {
    readonly description: string;
    readonly parameters: string;
    readonly hidden?: boolean;
    readonly execute: (context: TContext, args: readonly CommandArgument[], flags: FlagResult) => Promise<CommandResult> | CommandResult;
}

export type CommandSingleArgument = {
    readonly [P in keyof CommandVariableTypeMap as `as${UppercaseFirst<P>}`]: CommandVariableTypeMap[P];
}

export type CommandOptionalArgument = {
    readonly [P in keyof CommandVariableTypeMap as `asOptional${UppercaseFirst<P>}`]: CommandVariableTypeMap[P] | undefined;
}

export type CommandArrayArgument = {
    readonly [P in keyof CommandVariableTypeMap as `as${UppercaseFirst<P>}s`]: ReadonlyArray<CommandVariableTypeMap[P]>;
}

export interface CommandArgument extends CommandSingleArgument, CommandArrayArgument, CommandOptionalArgument {
}

export interface SubcommandDefinitionHolder<TContext extends CommandContext> {
    readonly parameters: string;
    readonly hidden?: boolean;
    readonly subcommands: ReadonlyArray<CommandDefinition<TContext>>;
}

export type CommandVariableTypeMap = {
    'literal': string;
    'bigint': bigint;
    'integer': number;
    'number': number;
    'role': Role;
    'channel': KnownChannel;
    'user': User;
    'sender': User | Webhook;
    'member': GuildMember;
    'duration': Duration;
    'boolean': boolean;
    'string': string;
}

export type CommandVariableTypeName = keyof CommandVariableTypeMap;

export type CommandVariableParser = <TContext extends CommandContext>(this: void, value: string, state: CommandBinderState<TContext>) => Awaitable<CommandBinderParseResult>

export interface CommandVariableTypeBase<Name extends CommandVariableTypeName> {
    readonly name: Name;
    readonly descriptionSingular?: string;
    readonly descriptionPlural?: string;
    readonly priority: number;
    parse: CommandVariableParser;
}

export interface LiteralCommandVariableType<T extends string> extends CommandVariableTypeBase<'literal'> {
    readonly choices: readonly T[];
}

export type UnmappedCommandVariableTypes = Exclude<CommandVariableTypeName, MappedCommandVariableTypes['name']>;
export type MappedCommandVariableTypes =
    | LiteralCommandVariableType<string>;

export type CommandVariableTypes =
    | MappedCommandVariableTypes
    | { [Name in UnmappedCommandVariableTypes]: CommandVariableTypeBase<Name> }[UnmappedCommandVariableTypes]

export type CommandVariableType<TName extends CommandVariableTypeName> = Extract<CommandVariableTypes, CommandVariableTypeBase<TName>>

export interface CommandSingleParameter<T extends CommandVariableTypeName, Concat extends boolean> {
    readonly kind: Concat extends false ? 'singleVar' : 'concatVar';
    readonly name: string;
    readonly raw: boolean;
    readonly type: CommandVariableType<T>;
    readonly required: boolean;
    readonly fallback: undefined | string;
}

export interface CommandGreedyParameter<T extends CommandVariableTypeName> {
    readonly kind: 'greedyVar';
    readonly name: string;
    readonly raw: boolean;
    readonly type: CommandVariableType<T>;
    readonly minLength: number;
}

export interface CommandLiteralParameter {
    readonly kind: 'literal';
    readonly name: string;
    readonly alias: string[];
}

export interface CommandHandler<TContext extends CommandContext> {
    get debugView(): string;
    readonly execute: (context: TContext) => Promise<CommandResult> | CommandResult;
}

export interface CommandSignature<TParameter = CommandParameter> {
    readonly description: string;
    readonly parameters: readonly TParameter[];
    readonly hidden: boolean;
}

export interface CommandSignatureHandler<TContext extends CommandContext> extends CommandSignature {
    readonly execute: (context: TContext, args: readonly CommandArgument[], flags: FlagResult) => Promise<CommandResult> | CommandResult;
}

export type CustomCommandShrinkwrap = {
    readonly [P in Exclude<keyof GuildSourceCommandTag, 'author' | 'authorizer'>]: GuildSourceCommandTag[P]
}

export interface GuildShrinkwrap {
    readonly cc: Record<string, CustomCommandShrinkwrap | undefined>;
}

export interface SignedGuildShrinkwrap {
    readonly signature?: string;
    readonly payload: GuildShrinkwrap;
}

export interface LookupChannelResult {
    channel: string;
    guild: string;
}

export interface GetStaffGuildsRequest {
    user: string;
    guilds: string[];
}

export interface ClusterRespawnRequest {
    id?: number;
    channel: string;
}

export interface SubtagListResult {
    [tagName: string]: SubtagDetails | undefined;
}

export interface SubtagDetails {
    readonly category: SubtagType;
    readonly name: string;
    readonly signatures: readonly SubtagSignatureDetails[];
    readonly deprecated: boolean | string;
    readonly staff: boolean;
    readonly aliases: readonly string[];
}

export interface GuildDetails {
    readonly id: string;
    readonly name: string;
    readonly iconUrl?: string;
}

export interface GuildPermissionDetails {
    readonly userId: string;
    readonly guild: GuildDetails;
    readonly ccommands: boolean;
    readonly censors: boolean;
    readonly autoresponses: boolean;
    readonly rolemes: boolean;
    readonly interval: boolean;
    readonly greeting: boolean;
    readonly farewell: boolean;
}

export interface CommandListResult {
    [commandName: string]: ICommandDetails | undefined;
}

export interface SubtagArgument {
    readonly parameter: SubtagHandlerValueParameter;
    readonly isCached: boolean;
    readonly value: string;
    readonly code: Statement;
    readonly raw: string;
    wait(): Promise<string>;
    execute(): Promise<string>;
}

export interface SubtagArgumentArray extends ReadonlyArray<SubtagArgument> {
    readonly subtagName: string;
}

export interface ArgumentResolver {
    readonly argRange: readonly [min: number, max: number];
    canResolve(subtag: SubtagCall): boolean;
    resolve(context: BBTagContext, subtagName: string, subtag: SubtagCall): Iterable<SubtagArgument>;
}

export interface ClusterStats {
    readonly id: number;
    readonly time: number;
    readonly readyTime: number;
    readonly guilds: number;
    readonly users: number;
    readonly channels: number;
    readonly rss: number;
    readonly userCpu: number;
    readonly systemCpu: number;
    readonly shardCount: number;
    readonly shards: readonly ShardStats[];
}

export interface ShardStats {
    readonly id: number;
    readonly status: keyof ConstantsStatus;
    readonly latency: number;
    readonly guilds: number;
    readonly cluster: number;
    readonly time: number;
}
export interface ClusterOptions {
    id: number;
    worker: ClusterWorker;
    shardCount: number;
    firstShardId: number;
    lastShardId: number;
}

export interface ClusterPoolOptions {
    worker?: string;
}

export interface FindEntityOptions {
    noLookup?: boolean;
    noErrors?: boolean;
}

export interface BanDetails {
    mod: User;
    reason: string;
}

export interface MassBanDetails {
    mod: User;
    type: string;
    users: User[];
    newUsers: User[];
    reason: string;
}

export interface SubtagOptions {
    name: string;
    aliases?: readonly string[];
    category: SubtagType;
    desc?: string;
    deprecated?: string | boolean;
    staff?: boolean;
    hidden?: boolean;
}

export interface RuntimeLimitRule {
    check(context: BBTagContext, subtagName: string): Awaitable<void>;
    displayText(subtagName: string, scopeName: string): string;
    state(): JToken;
    load(state: JToken): void;
}

export type GuildCommandContext<TChannel extends GuildTextBasedChannels = GuildTextBasedChannels> = CommandContext<TChannel> & { message: { member: GuildMember; guildID: string; }; };
export type PrivateCommandContext<TChannel extends PrivateTextBasedChannels = PrivateTextBasedChannels> = CommandContext<TChannel>;

export type CommandPropertiesSet = { [key in CommandType]: CommandProperties; }
export interface CommandProperties {
    readonly name: string;
    readonly description: string;
    readonly defaultPerms: bigint;
    readonly isVisible: (util: ClusterUtilities, location?: Guild | TextBasedChannels, user?: User) => boolean | Promise<boolean>;
    readonly color: number;
}

export type GuildSettingTypeName<T> =
    T extends string ? 'string' | 'channel' | 'role' | 'permission' :
    T extends number ? 'float' | 'int' :
    T extends boolean ? 'bool' : never

export type GuildSettingDescriptor<T extends keyof StoredGuildSettings = keyof StoredGuildSettings> = {
    key: T;
    name: string;
    desc: string;
    type: GuildSettingTypeName<StoredGuildSettings[T]>;
}

export type SubtagPropertiesSet = { [key in SubtagType]: SubtagProperties; }
export interface SubtagProperties {
    readonly name: string;
    readonly desc: string;
    readonly hidden?: boolean;
}

export interface SubtagVariableProperties {
    table: string;
}

export type WhitelistResponse = 'approved' | 'rejected' | 'requested' | 'alreadyApproved' | 'alreadyRejected';

export type PollResponse = BasePollResponse<'OPTIONS_EMPTY' | 'TOO_SHORT' | 'FAILED_SEND' | 'NO_ANNOUNCE_PERMS'> | PollSuccess | PollInvalidOption;

export interface BasePollResponse<T extends string> {
    readonly state: T;
}

export interface PollInvalidOption<T extends string = 'OPTIONS_INVALID'> extends BasePollResponse<T> {
    readonly failedReactions: EmojiIdentifierResolvable[];
}

export interface PollSuccess extends PollInvalidOption<'SUCCESS'> {
    readonly message: Message;
}

export type EnsureMutedRoleResult = 'success' | 'unconfigured' | 'noPerms';
export type MuteResult = 'success' | 'alreadyMuted' | 'noPerms' | 'roleMissing' | 'roleTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow';
export type UnmuteResult = 'success' | 'notMuted' | 'noPerms' | 'roleTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow';
export type BanResult = 'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow';
export type MassBanResult = User[] | Exclude<BanResult, 'success'> | 'noUsers';
export type KickResult = 'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow';
export type UnbanResult = 'success' | 'notBanned' | 'noPerms' | 'moderatorNoPerms';

export interface WarnDetails {
    readonly count: number;
    readonly banAt?: number;
    readonly kickAt?: number;
}

export interface WarnResultBase<ModType extends ModerationType, TResult extends string> {
    readonly type: ModType;
    readonly warnings: number;
    readonly state: TResult;
}

export type WarnResult =
    | WarnResultBase<ModerationType.BAN, BanResult>
    | WarnResultBase<ModerationType.KICK, KickResult>
    | WarnResultBase<ModerationType.WARN, 'success' | 'countNaN' | 'countNegative' | 'countZero'>;

export interface PardonResult {
    readonly warnings: number;
    readonly state: 'success' | 'countNaN' | 'countNegative' | 'countZero';

}

export type CommandBinderParseResult =
    | CommandBinderValue
    | CommandBinderDeferred;

export type CommandBinderValue =
    | CommandBinderSuccess
    | CommandBinderFailure

export interface CommandBinderSuccess {
    success: true;
    value: CommandArgument;
}

export interface CommandBinderFailure {
    success: false;
    error: CommandBinderStateFailureReason;
}

export interface CommandBinderDeferred {
    success: 'deferred';
    getValue(): CommandBinderValue | Promise<CommandBinderValue>;
}

export interface CommandBinderStateLookupCache {
    findUser(userString: string): Awaitable<CommandBinderParseResult>;
    findSender(userString: string): Awaitable<CommandBinderParseResult>;
    findMember(memberString: string): Awaitable<CommandBinderParseResult>;
    findRole(roleString: string): Awaitable<CommandBinderParseResult>;
    findChannel(channelString: string): Awaitable<CommandBinderParseResult>;
}

export interface CommandBinderState<TContext extends CommandContext> {
    readonly context: TContext;
    readonly command: ScopedCommandBase<TContext>;
    readonly arguments: ReadonlyArray<CommandBinderDeferred | CommandBinderSuccess>;
    readonly flags: FlagResult;
    readonly argIndex: number;
    readonly bindIndex: number;
    readonly handler?: CommandSignatureHandler<TContext>;
    readonly lookupCache: CommandBinderStateLookupCache;
    addFailure(index: number, reason: CommandBinderStateFailureReason): void;
}

export interface CommandBinderStateFailureReason {
    notEnoughArgs?: string[];
    tooManyArgs?: boolean;
    parseFailed?: {
        attemptedValue: string;
        types: string[];
    };
}

export interface AwaitReactionsResponse {
    message: Message;
    reaction: MessageReaction | PartialMessageReaction;
    user: User;
}
