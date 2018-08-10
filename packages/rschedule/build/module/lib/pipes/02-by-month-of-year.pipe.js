import { PipeRule } from './interfaces';
export class ByMonthOfYearPipe extends PipeRule {
    constructor() {
        super(...arguments);
        this.upcomingMonths = [];
    }
    run(args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (this.options.frequency === 'YEARLY') {
            return this.expand(args);
        }
        else
            return this.filter(args);
    }
    expand(args) {
        const date = args.date;
        if (this.upcomingMonths.length === 0) {
            this.upcomingMonths = this.options.byMonthOfYear.filter(month => date.get('month') <= month);
            if (this.upcomingMonths.length === 0) {
                return this.nextPipe.run({ date: date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byDayOfMonth || this.options.byDayOfWeek)
                date.set('day', 1);
            if (this.options.byHourOfDay)
                date.set('hour', 0);
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        let nextMonth = this.upcomingMonths.shift();
        date.set('month', nextMonth);
        if (this.upcomingMonths.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date });
    }
    filter(args) {
        let validMonth = false;
        let nextValidMonthThisYear = null;
        // byMonthOfYear array is sorted
        for (const month of this.options.byMonthOfYear) {
            if (args.date.get('month') === month) {
                validMonth = true;
                break;
            }
            else if (args.date.get('month') < month) {
                nextValidMonthThisYear = month;
                break;
            }
        }
        if (validMonth)
            return this.nextPipe.run({ date: args.date });
        let next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the year?
        //
        // - We know the current `options.frequency` is not yearly
        if (nextValidMonthThisYear !== null) {
            // if yes, advance the current date forward to the next month which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'month');
            next.set('month', nextValidMonthThisYear);
        }
        else {
            // if no, advance the current date forward one year &
            // and set the date to whatever month would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'year');
            next.add(1, 'year');
            next.set('month', this.options.byMonthOfYear[0]);
        }
        return this.nextPipe.run({ invalidDate: true, skipToIntervalOnOrAfter: next, date: args.date });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDItYnktbW9udGgtb2YteWVhci5waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9waXBlcy8wMi1ieS1tb250aC1vZi15ZWFyLnBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLFFBQVEsRUFBeUIsTUFBTSxjQUFjLENBQUE7QUFFOUQsTUFBTSx3QkFBbUQsU0FBUSxRQUFXO0lBQTVFOztRQVVVLG1CQUFjLEdBQXlCLEVBQUUsQ0FBQTtJQW1FbkQsQ0FBQztJQTNFQyxHQUFHLENBQUMsSUFBbUI7UUFDckIsSUFBSSxJQUFJLENBQUMsV0FBVztZQUFFLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFcEQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUU7WUFDdkMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQ3pCOztZQUFNLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBR0QsTUFBTSxDQUFDLElBQW1CO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7UUFFdEIsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDcEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFBO1lBRTdGLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNwQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFB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