import { ByMonthOfYearPipe } from './02-by-month-of-year.pipe';
import { ByDayOfMonthPipe } from './05-by-day-of-month.pipe';
import { ByDayOfWeekPipe } from './06-by-day-of-week.pipe';
import { ByHourOfDayPipe } from './07-by-hour-of-day.pipe';
import { ByMinuteOfHourPipe } from './08-by-minute-of-hour.pipe';
import { BySecondOfMinutePipe } from './09-by-second-of-minute.pipe';
import { FrequencyPipe } from './01-frequency.pipe';
import { ResultPipe } from './11-result.pipe';
/**
 * Steps
 *
 * 1. Figure out start date and, optionally, end date
 * 2. Figure out which months are applicable to that start date and end date
 * 3. remove `byMonthOfYear` months that aren't applicable
 *
 * - for whatever `byXXX` rules aren't supplied, have pipes at the end that fill
 *   in the date with the appropriate bits of the starting date.
 *
 * - the start date needs to be a valid occurrence
 */
export class PipeController {
    constructor(options, args) {
        this.options = options;
        this.isIteratingInReverseOrder = false;
        this.expandingPipes = [];
        /**
         * If the parent of this pipe controller (`Rule` object) changes the `options` object
         * this pipe controller will be invalid. To prevent someone from accidently continuing
         * to use an invalid iterator, we invalidate the old one so it will throw an error.
         */
        this.invalid = false;
        this.pipes = [];
        const frequencyPipe = new FrequencyPipe(this);
        this.expandingPipes.push(frequencyPipe);
        this.addPipe(frequencyPipe);
        // The ordering is defined in the ICAL spec https://tools.ietf.org/html/rfc5545#section-3.3.10
        if (this.options.byMonthOfYear !== undefined)
            this.addPipe(new ByMonthOfYearPipe(this));
        if (this.options.byDayOfMonth !== undefined)
            this.addPipe(new ByDayOfMonthPipe(this));
        if (this.options.byDayOfWeek !== undefined)
            this.addPipe(new ByDayOfWeekPipe(this));
        if (this.options.byHourOfDay !== undefined)
            this.addPipe(new ByHourOfDayPipe(this));
        if (this.options.byMinuteOfHour !== undefined)
            this.addPipe(new ByMinuteOfHourPipe(this));
        if (this.options.bySecondOfMinute !== undefined)
            this.addPipe(new BySecondOfMinutePipe(this));
        this.addPipe(new ResultPipe(this));
        this.isIteratingInReverseOrder = !!args.reverse;
        this.setStartDate(args.start);
        this.setEndDate(args.end);
        this.setCount(args.take);
    }
    get focusedPipe() {
        return this.expandingPipes[this.expandingPipes.length - 1];
    }
    // to conform to the `RunnableIterator` interface
    get startDate() {
        return this.start;
    }
    get isInfinite() {
        return !this.end && this.count === undefined;
    }
    *_run() {
        let date = this.focusedPipe.run({ skipToIntervalOnOrAfter: this.start });
        let index = 0;
        while (date && (this.count === undefined || index < this.count)) {
            index++;
            if (date && this.end && date.isAfter(this.end))
                date = null;
            else if (date) {
                yield date.clone();
                date = this.focusedPipe.run({ date });
            }
        }
    }
    addPipe(pipe) {
        const lastPipe = this.pipes[this.pipes.length - 1];
        this.pipes.push(pipe);
        if (lastPipe) {
            lastPipe.nextPipe = pipe;
        }
    }
    setStartDate(date) {
        this.start =
            date && date.isAfterOrEqual(this.options.start) ? date.clone() : this.options.start.clone();
    }
    setEndDate(date) {
        if (date && this.options.until)
            this.end = date.isBefore(this.options.until) ? date.clone() : this.options.until.clone();
        else if (this.options.until)
            this.end = this.options.until.clone();
        else if (date)
            this.end = date.clone();
    }
    setCount(take) {
        if (take !== undefined && this.options.count !== undefined)
            this.count = take > this.options.count ? this.options.count : take;
        else if (take !== undefined)
            this.count = take;
        else if (this.options.count !== undefined)
            this.count = this.options.count;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS1jb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9waXBlcy9waXBlLWNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sNEJBQTRCLENBQUE7QUFDOUQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDNUQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBQzFELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUMxRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQTtBQUNoRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQTtBQUNwRSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDbkQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBRzdDOzs7Ozs7Ozs7OztHQVdHO0FBRUgsTUFBTTtJQStCSixZQUNTLE9BQW9DLEVBQzNDLElBQThEO1FBRHZELFlBQU8sR0FBUCxPQUFPLENBQTZCO1FBM0J0Qyw4QkFBeUIsR0FBRyxLQUFLLENBQUE7UUFFakMsbUJBQWMsR0FBbUIsRUFBRSxDQUFBO1FBVzFDOzs7O1dBSUc7UUFDSSxZQUFPLEdBQUcsS0FBSyxDQUFBO1FBTWQsVUFBSyxHQUFtQixFQUFFLENBQUE7UUFNaEMsTUFBTSxhQUFhLEdBQUcsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFN0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7UUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUUzQiw4RkFBOEY7UUFDOUYsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsS0FBSyxTQUFT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