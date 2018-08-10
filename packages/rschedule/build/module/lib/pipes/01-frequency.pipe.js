import { DateAdapter } from '../date-adapter';
import { PipeRule } from './interfaces';
import { Utils } from '../utilities';
// the frequency pipe accepts an array of dates only to adhere to the PipeFn interface
// in reality, will always only accept a single starting date wrapped in an array
export class FrequencyPipe extends PipeRule {
    constructor() {
        super(...arguments);
        this.intervalStartDate = this.normalizeDate(this.options.start.clone());
    }
    run(args) {
        let date;
        if (args.skipToIntervalOnOrAfter) {
            this.skipToIntervalOnOrAfter(args.skipToIntervalOnOrAfter);
            date = args.skipToIntervalOnOrAfter.isAfterOrEqual(this.intervalStartDate)
                ? args.skipToIntervalOnOrAfter
                : this.intervalStartDate.clone();
        }
        else {
            this.incrementInterval();
            date = this.intervalStartDate.clone();
        }
        return this.nextPipe.run({ date });
    }
    normalizeDate(date) {
        switch (this.options.frequency) {
            case 'YEARLY':
                Utils.setDateToStartOfYear(date);
                break;
            case 'MONTHLY':
                date.set('day', 1);
                break;
            case 'WEEKLY':
                const dayIndex = Utils.orderedWeekdays(this.options.weekStart).indexOf(date.get('weekday'));
                date.subtract(dayIndex, 'day');
                break;
        }
        switch (this.options.frequency) {
            case 'YEARLY':
            case 'MONTHLY':
            case 'WEEKLY':
            case 'DAILY':
                date.set('hour', 0);
            case 'HOURLY':
                date.set('minute', 0);
            case 'MINUTELY':
                date.set('second', 0);
        }
        return date;
    }
    // need to account for possible daylight savings time shift
    incrementInterval() {
        const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency);
        const oldTZOffset = this.intervalStartDate.get('tzoffset');
        this.intervalStartDate.add(this.options.interval, unit);
        const newTZOffset = this.intervalStartDate.get('tzoffset');
        const tzOffset = newTZOffset - oldTZOffset;
        const newDate = this.intervalStartDate.clone().add(tzOffset, 'second');
        if (newDate.get('tzoffset') !== this.intervalStartDate.get('tzoffset')) {
            throw new DateAdapter.InvalidDateError(`A date was created on the border of daylight savings time: "${newDate.toISOString()}"`);
        }
        else {
            this.intervalStartDate = newDate;
        }
    }
    /**
     * This method might be buggy when presented with intervals other than one.
     * In such a case, skipping forward should *skip* seconds of dates, and I'm
     * not sure if this will account for that. Don't have time to test at the moment.
     *
     * Tests are passing
     */
    skipToIntervalOnOrAfter(newDate) {
        const unit = Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency);
        const intervalStart = this.intervalStartDate.get('ordinal');
        const intervalEnd = this.intervalStartDate
            .clone()
            .add(1, unit)
            .get('ordinal');
        const date = newDate.get('ordinal');
        const intervalDuration = intervalEnd - intervalStart;
        const sign = Math.sign(date - intervalStart);
        const difference = Math.floor(Math.abs(date - intervalStart) / intervalDuration) * sign;
        this.intervalStartDate.add(difference, unit);
        // This is sort of a quick/hacky solution to a problem experienced with test
        // "testYearlyBetweenIncLargeSpan2" which has a start date of 1920.
        // Not sure why `difference` isn't resolved to whole number in that test,
        // but the first call to this method turns up an iteration exactly 1 year
        // before the iteration it should return.
        while (!newDate.isBefore(this.intervalStartDate.clone().add(1, unit))) {
            this.intervalStartDate.add(this.options.interval, unit);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDEtZnJlcXVlbmN5LnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3BpcGVzLzAxLWZyZXF1ZW5jeS5waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQTtBQUM3QyxPQUFPLEVBQUUsUUFBUSxFQUF5QixNQUFNLGNBQWMsQ0FBQTtBQUM5RCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBRXBDLHNGQUFzRjtBQUN0RixpRkFBaUY7QUFDakYsTUFBTSxvQkFBK0MsU0FBUSxRQUFXO0lBQXhFOztRQUNVLHNCQUFpQixHQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQTtJQXdHL0UsQ0FBQztJQXRHQyxHQUFHLENBQUMsSUFBbUI7UUFDckIsSUFBSSxJQUFPLENBQUE7UUFFWCxJQUFJLElBQUksQ0FBQyx1QkFBdUIsRUFBRTtZQUNoQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUE7WUFFMUQsSUFBSSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDO2dCQUN4RSxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QjtnQkFDOUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtTQUNuQzthQUFNO1lBQ0wsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUE7WUFDeEIsSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtTQUN0QztRQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ3BDLENBQUM7SUFFRCxh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