import { PipeRule } from './interfaces';
export class ByHourOfDayPipe extends PipeRule {
    constructor() {
        super(...arguments);
        this.upcomingHours = [];
    }
    run(args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'].includes(this.options.frequency)) {
            return this.expand(args);
        }
        else
            return this.filter(args);
    }
    expand(args) {
        const date = args.date;
        if (this.upcomingHours.length === 0) {
            this.upcomingHours = this.options.byHourOfDay.filter(hour => date.get('hour') <= hour);
            if (this.upcomingHours.length === 0) {
                return this.nextPipe.run({ date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        let nextHour = this.upcomingHours.shift();
        date.set('hour', nextHour);
        if (this.upcomingHours.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date });
    }
    filter(args) {
        let validHour = false;
        let nextValidHourThisDay = null;
        // byHourOfYear array is sorted
        for (const hour of this.options.byHourOfDay) {
            if (args.date.get('hour') === hour) {
                validHour = true;
                break;
            }
            else if (args.date.get('hour') < hour) {
                nextValidHourThisDay = hour;
                break;
            }
        }
        if (validHour)
            return this.nextPipe.run({ date: args.date });
        let next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the year?
        //
        // - We know the current `options.frequency` is not yearly
        if (nextValidHourThisDay !== null) {
            // if yes, advance the current date forward to the next hour which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'hour');
            next.set('hour', nextValidHourThisDay);
        }
        else {
            // if no, advance the current date forward one day &
            // and set the date to whatever hour would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'day');
            next.add(1, 'day');
            next.set('hour', this.options.byHourOfDay[0]);
        }
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDctYnktaG91ci1vZi1kYXkucGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcGlwZXMvMDctYnktaG91ci1vZi1kYXkucGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsUUFBUSxFQUF5QixNQUFNLGNBQWMsQ0FBQTtBQUc5RCxNQUFNLHNCQUFpRCxTQUFRLFFBQVc7SUFBMUU7O1FBU1Usa0JBQWEsR0FBMEIsRUFBRSxDQUFBO0lBcUVuRCxDQUFDO0lBN0VDLEdBQUcsQ0FBQyxJQUFtQjtRQUNyQixJQUFJLElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVwRCxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDN0UsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQ3pCOztZQUFNLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBR0QsTUFBTSxDQUFDLElBQW1CO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7UUFFdEIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFBO1lBRXZGLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNuQyxPQUFPLElB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