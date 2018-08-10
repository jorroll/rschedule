import { PipeRule } from './interfaces';
export class ByMinuteOfHourPipe extends PipeRule {
    constructor() {
        super(...arguments);
        this.upcomingMinutes = [];
    }
    run(args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (['MINUTELY', 'SECONDLY'].includes(this.options.frequency)) {
            return this.filter(args);
        }
        else
            return this.expand(args);
    }
    expand(args) {
        const date = args.date;
        if (this.upcomingMinutes.length === 0) {
            this.upcomingMinutes = this.options.byMinuteOfHour.filter(minute => date.get('minute') <= minute);
            if (this.upcomingMinutes.length === 0) {
                return this.nextPipe.run({ date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        let nextMinute = this.upcomingMinutes.shift();
        date.set('minute', nextMinute);
        if (this.upcomingMinutes.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date });
    }
    filter(args) {
        let validMinute = false;
        let nextValidMinuteThisHour = null;
        // byMinuteOfHour array is sorted
        for (const minute of this.options.byMinuteOfHour) {
            if (args.date.get('minute') === minute) {
                validMinute = true;
                break;
            }
            else if (args.date.get('minute') < minute) {
                nextValidMinuteThisHour = minute;
                break;
            }
        }
        if (validMinute)
            return this.nextPipe.run({ date: args.date });
        let next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the hour?
        if (nextValidMinuteThisHour !== null) {
            // if yes, advance the current date forward to the next minute which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'minute');
            next.set('minute', nextValidMinuteThisHour);
        }
        else {
            // if no, advance the current date forward one hour &
            // and set the date to whatever minute would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'hour');
            next.add(1, 'hour');
            next.set('minute', this.options.byMinuteOfHour[0]);
        }
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDgtYnktbWludXRlLW9mLWhvdXIucGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcGlwZXMvMDgtYnktbWludXRlLW9mLWhvdXIucGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsUUFBUSxFQUF5QixNQUFNLGNBQWMsQ0FBQTtBQUc5RCxNQUFNLHlCQUFvRCxTQUFRLFFBQVc7SUFBN0U7O1FBVVUsb0JBQWUsR0FBNkIsRUFBRSxDQUFBO0lBb0V4RCxDQUFDO0lBNUVDLEdBQUcsQ0FBQyxJQUFtQjtRQUNyQixJQUFJLElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVwRCxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQzdELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUN6Qjs7WUFBTSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDakMsQ0FBQztJQUdELE1BQU0sQ0FBQyxJQUFtQjtRQUN4QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1FBRXRCLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFlLENBQUMsTUFBTSxDQUN4RCxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksTUFBTSxDQUN2QyxDQUFBO1lBRUQsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDLFFBQVEs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