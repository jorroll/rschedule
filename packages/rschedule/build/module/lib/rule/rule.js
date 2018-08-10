import { PipeController } from '../pipes';
import { buildValidatedRuleOptions } from './rule-options';
import { ruleOptionsToIcalString, datesToIcalString } from '../ical';
import { HasOccurrences, OccurrenceIterator, } from '../interfaces';
import uniqWith from 'lodash.uniqwith';
import { Utils } from '../utilities';
export class Rule extends HasOccurrences {
    constructor(options) {
        super();
        this.usedPipeControllers = []; // only so that we can invalidate them, if necessary
        this.options = options;
    }
    /**
     * NOTE: The options object is frozen. To make changes you must assign a new options object.
     */
    get options() {
        return this._options;
    }
    set options(value) {
        // the old pipe controllers become invalid when the options change.
        // just to make sure someone isn't still using an old iterator function,
        // we mark the old controllers as invalid.
        // Yay for forseeing/preventing possible SUPER annoying bugs!!!
        this.usedPipeControllers.forEach(controller => (controller.invalid = true));
        this.usedPipeControllers = [];
        this.processedOptions = buildValidatedRuleOptions(value);
        this._options = Object.freeze({ ...value });
    }
    get isInfinite() {
        return this.options.until === undefined && this.options.count === undefined;
    }
    /** From `options.start`. Note: you should not mutate the start date directly */
    get startDate() {
        return this.options.start;
    }
    occurrences(args = {}) {
        return new OccurrenceIterator(this, args);
    }
    /**  @private use occurrences() instead */
    *_run(args = {}) {
        const controller = new PipeController(this.processedOptions, args);
        this.usedPipeControllers.push(controller);
        const iterator = controller._run();
        let date = iterator.next().value;
        while (date) {
            date.rule = this;
            yield date;
            date = iterator.next().value;
        }
    }
    toICal() {
        return '';
    }
}
export class RRule extends Rule {
    toICal() {
        return ruleOptionsToIcalString(this.options, 'RRULE');
    }
}
/**
 * This base class provides an iterable wrapper around the RDATEs array so that
 * it can be interacted with in the same manner as `Rule`
 */
export class RDatesBase extends HasOccurrences {
    constructor(dates) {
        super();
        this.dates = dates;
        this.isInfinite = false;
    }
    get length() {
        return this.dates.length;
    }
    get startDate() {
        return Utils.getEarliestDate(this.dates);
    }
    occurrences(args = {}) {
        return new OccurrenceIterator(this, args);
    }
    *_run(args = {}) {
        let dates = Utils.sortDates(uniqWith(this.dates, (a, b) => a.isEqual(b)));
        if (args.start)
            dates = dates.filter(date => date.isAfterOrEqual(args.start));
        if (args.end)
            dates = dates.filter(date => date.isBeforeOrEqual(args.end));
        if (args.take)
            dates = dates.slice(0, args.take);
        let date = dates.shift();
        while (date) {
            yield date;
            date = dates.shift();
        }
    }
    toICal() {
        return '';
    }
}
export class RDates extends RDatesBase {
    toICal() {
        return datesToIcalString(this.dates, 'RDATE');
    }
}
export class EXDates extends RDatesBase {
    toICal() {
        return datesToIcalString(this.dates, 'EXDATE');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcnVsZS9ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxVQUFVLENBQUE7QUFDekMsT0FBTyxFQUFFLHlCQUF5QixFQUFXLE1BQU0sZ0JBQWdCLENBQUE7QUFFbkUsT0FBTyxFQUFFLHVCQUF1QixFQUFFLGlCQUFpQixFQUFFLE1BQU0sU0FBUyxDQUFBO0FBQ3BFLE9BQU8sRUFDTCxjQUFjLEVBS2Qsa0JBQWtCLEdBQ25CLE1BQU0sZUFBZSxDQUFBO0FBQ3RCLE9BQU8sUUFBUSxNQUFNLGlCQUFpQixDQUFBO0FBQ3RDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFFcEMsTUFBTSxXQUFvRSxTQUFRLGNBQWlCO0lBb0NqRyxZQUFZLE9BQW1DO1FBQzdDLEtBQUssRUFBRSxDQUFBO1FBSkQsd0JBQW1CLEdBQXdCLEVBQUUsQ0FBQSxDQUFDLG9EQUFvRDtRQUt4RyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtJQUN4QixDQUFDO0lBcENEOztPQUVHO0lBQ0gsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFBO0lBQ3RCLENBQUM7SUFDRCxJQUFJLE9BQU8sQ0FBQyxLQUFpQztRQUMzQyxtRUFBbUU7UUFDbkUsd0VBQXdFO1FBQ3hFLDBDQUEwQztRQUMxQywrREFBK0Q7UUFDL0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBQzNFLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLENBQUE7UUFDN0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXhELElBQUksQ0FBQyxRQUFR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