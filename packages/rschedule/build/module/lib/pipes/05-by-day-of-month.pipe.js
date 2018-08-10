import { PipeRule } from './interfaces';
import { isLeapYear } from 'date-fns';
import uniq from 'lodash.uniq';
import { Utils } from '../utilities';
export class ByDayOfMonthPipe extends PipeRule {
    constructor() {
        super(...arguments);
        this.upcomingMonthDays = [];
        this.upcomingDays = [];
    }
    run(args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (this.options.frequency === 'YEARLY' && this.options.byMonthOfYear === undefined) {
            return this.yearlyExpand(args);
        }
        else if (['YEARLY', 'MONTHLY'].includes(this.options.frequency)) {
            return this.expand(args);
        }
        else
            return this.filter(args);
    }
    yearlyExpand(args) {
        const date = args.date;
        if (this.upcomingMonthDays.length === 0) {
            this.upcomingMonthDays = getUpcomingMonthDays(date, this.options);
            if (this.upcomingMonthDays.length === 0) {
                const next = Utils.setDateToStartOfYear(date.clone().add(1, 'year'));
                return this.nextPipe.run({ invalidDate: true, date, skipToIntervalOnOrAfter: next });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byHourOfDay)
                date.set('hour', 0);
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        let nextDay = this.upcomingMonthDays.shift();
        date.set('month', nextDay[0]).set('day', nextDay[1]);
        if (this.upcomingMonthDays.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date });
    }
    expand(args) {
        const date = args.date;
        if (this.upcomingDays.length === 0) {
            this.upcomingDays = getUpcomingDays(date, this.options);
            if (this.upcomingDays.length === 0) {
                const next = date
                    .clone()
                    .add(1, 'month')
                    .set('day', 1);
                return this.nextPipe.run({ invalidDate: true, date: date, skipToIntervalOnOrAfter: next });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byHourOfDay)
                date.set('hour', 0);
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        let nextDay = this.upcomingDays.shift();
        date.set('day', nextDay);
        if (this.upcomingDays.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date });
    }
    filter(args) {
        const upcomingDays = getUpcomingDays(args.date, this.options);
        let validDay = false;
        let nextValidDayThisMonth = null;
        for (const day of upcomingDays) {
            if (args.date.get('day') === day) {
                validDay = true;
                break;
            }
            else if (args.date.get('day') < day) {
                nextValidDayThisMonth = day;
                break;
            }
        }
        if (validDay)
            return this.nextPipe.run({ date: args.date });
        let next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the month?
        //
        // Note:
        // We know the current `options.frequency` is not yearly or monthly or weekly
        if (nextValidDayThisMonth !== null) {
            // if yes, advance the current date forward to the next month which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'day');
            next.add(nextValidDayThisMonth - args.date.get('day'), 'day');
        }
        else {
            // if no, advance the current date forward one year &
            // and set the date to whatever month would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'month');
            next.add(1, 'month');
            const nextDay = getUpcomingDays(next, this.options)[0];
            next.set('day', nextDay);
        }
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    }
}
function getUpcomingMonthDays(date, options) {
    const next = date.clone();
    const monthDays = [];
    for (let i = next.get('month'); i <= 12; i++) {
        const days = getUpcomingDays(next, options);
        monthDays.push(...days.map(day => [next.get('month'), day]));
        next.add(1, 'month').set('day', 1);
        i++;
    }
    return monthDays;
}
function getUpcomingDays(date, options) {
    const daysInMonth = getDaysInMonth(date.get('month'), date.get('year'));
    return uniq(options
        .byDayOfMonth.filter(day => {
        return daysInMonth >= Math.abs(day);
    })
        .map(day => (day > 0 ? day : daysInMonth + day + 1))
        .sort((a, b) => {
        if (a > b)
            return 1;
        if (a < b)
            return -1;
        else
            return 0;
    })).filter(day => date.get('day') <= day);
}
function getDaysInMonth(month, year) {
    const block = {
        1: 31,
        2: getDaysInFebruary(year),
        3: 31,
        4: 30,
        5: 31,
        6: 30,
        7: 31,
        8: 31,
        9: 30,
        10: 31,
        11: 30,
        12: 31,
    };
    return block[month];
}
function getDaysInFebruary(year) {
    return isLeapYear(new Date(year, 0, 1)) ? 29 : 28;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDUtYnktZGF5LW9mLW1vbnRoLnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3BpcGVzLzA1LWJ5LWRheS1vZi1tb250aC5waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxRQUFRLEVBQXlCLE1BQU0sY0FBYyxDQUFBO0FBQzlELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxVQUFVLENBQUE7QUFDckMsT0FBTyxJQUFJLE1BQU0sYUFBYSxDQUFBO0FBQzlCLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFFcEMsTUFBTSx1QkFBa0QsU0FBUSxRQUFXO0lBQTNFOztRQVlVLHNCQUFpQixHQUF1QixFQUFFLENBQUE7UUE0QjFDLGlCQUFZLEdBQWEsRUFBRSxDQUFBO0lBNEVyQyxDQUFDO0lBbEhDLEdBQUcsQ0FBQyxJQUFtQjtRQUNyQixJQUFJLElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVwRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsS0FBSyxTQUFTLEVBQUU7WUFDbkYsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQy9CO2FBQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNqRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDekI7O1lBQU0sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ2pDLENBQUM7SUFHRCxZQUFZLENBQUMsSUFBbUI7UUFDOUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxD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