import { BBTagAST, BBTagASTCall, BBTagCompileResult, BBTagExecutionPlan, BBTagExecutionResult, DebugMessage } from '@cluster/types';
import { bbtagUtil } from '@cluster/utils';
import { Timer } from '@core/Timer';
import moment, { Duration } from 'moment';

import { BBTagContext } from './BBTagContext';

export class BBTagCompiler {
    public compile(source: string, context: BBTagContext): BBTagCompileResult {
        const timer = new Timer().start();
        const parsed = bbtagUtil.parse(source, context);
        const parseDuration = timer.duration;
        timer.end().start(true);
        const executionPlan = bbtagUtil.buildExecutionPlan(context, parsed);
        const executionPlanDuration = timer.duration;
        timer.end();

        return new BBTagCompileResultImpl(source, context, parsed, parseDuration, executionPlan, executionPlanDuration);
    }
}

class BBTagCompileResultImpl implements BBTagCompileResult {
    public readonly warnings: readonly DebugMessage[];
    public readonly errors: readonly DebugMessage[];

    public constructor(
        public readonly source: string,
        private readonly context: BBTagContext,
        public readonly parsed: BBTagAST,
        public readonly parseDuration: Duration,
        public readonly executionPlan: BBTagExecutionPlan,
        public readonly executionPlanDuration: Duration
    ) {
        this.warnings = context.warnings.splice(0, Infinity);
        this.errors = context.errors.splice(0, Infinity);
    }

    public async execute(caller?: BBTagASTCall): Promise<BBTagExecutionResult> {
        let content;
        if (this.context.cooldowns.get(this.context).isAfter(moment())) {
            const remaining = moment.duration(this.context.cooldowns.get(this.context).diff(moment()));
            if (this.context.state.stackSize === 0)
                await this.context.sendOutput(`This ${this.context.isCC ? 'custom command' : 'tag'} is currently under cooldown. Please try again <t:${moment().add(remaining).unix()}:R>.`);
            content = this.context.addError(`Cooldown: ${remaining.asMilliseconds()}`, caller);
        } else if (this.context.state.stackSize > 200) {
            content = this.context.addError(`Terminated recursive tag after ${this.context.state.stackSize} execs.`, caller);
        } else {
            this.context.cooldowns.set(this.context);
            this.context.execTimer.start();
            this.context.state.stackSize++;
            content = await bbtagUtil.execute(this.context, this.executionPlan).join('');
            if (this.context.state.replace !== undefined)
                content = content.replace(this.context.state.replace.regex, this.context.state.replace.with);
            this.context.state.stackSize--;
            this.context.execTimer.end();
            await this.context.variables.persist();
            if (this.context.state.stackSize === 0)
                await this.context.sendOutput(content);
        }

        return {
            source: this.source,
            tagName: this.context.rootTagName,
            input: this.context.inputRaw,
            content: content,
            debug: this.context.debug,
            errors: this.context.errors,
            duration: {
                active: this.context.execTimer.elapsed,
                database: this.context.dbTimer.elapsed,
                total: this.context.totalDuration.asMilliseconds(),
                subtag: this.context.state.subtags
            },
            database: {
                committed: this.context.dbObjectsCommitted,
                values: this.context.variables.list.reduce<Record<string, JToken>>((v, c) => {
                    v[c.key] = c.value;
                    return v;
                }, {})
            }
        };
    }

}
