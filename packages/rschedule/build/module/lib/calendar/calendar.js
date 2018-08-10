import { HasOccurrences, OccurrenceIterator, } from '../interfaces';
import { CollectionIterator } from './collection';
import { Utils } from '../utilities';
export class Calendar extends HasOccurrences {
    constructor(args = {}) {
        super();
        this.schedules = [];
        if (Array.isArray(args.schedules))
            this.schedules = args.schedules.slice();
        else if (args.schedules)
            this.schedules.push(args.schedules);
    }
    get startDate() {
        return Utils.getEarliestDate(this.schedules
            .map(schedule => schedule.startDate)
            .filter(date => !!date));
    }
    get isInfinite() {
        return this.schedules.some(schedule => schedule.isInfinite);
    }
    /**
     * Iterates over the calendar's occurrences and bundles them into collections
     * with a specified granularity (default is `"INSTANTANIOUS"`). Each `Collection`
     * object has:
     *
     *   - a `dates` property containing an array of DateAdapter objects.
     *   - a `period` property containing the granularity.
     *   - a `periodStart` property containing a DateAdapter equal to the period's
     *     start time.
     *   - a `periodEnd` property containing a DateAdapter equal to the period's
     *     end time.
     *
     * The `periodStart` value of `Collection` objects produced by this method does not
     * necessarily increment linearly. A collection *always* contains at least one date,
     * so the `periodStart` from one collection to the next can "jump".
     *
     * Example: If your granularity is `"DAILY"` and you start in January, but the earliest
     * a schedule outputs a date is in February, the first Collection produced will have a
     * `periodStart` in February.
     *
     * Another thing: when giving a `take` argument to `collections()`, you are specifying
     * the number of `Collection` objects to return (rather than occurrences).
     *
     * @param args
     */
    collections(args = {}) {
        return new CollectionIterator(this, args);
    }
    /**
     * Iterates over the calendar's occurrences and simply spits them out in order.
     * Unlike `Schedule#occurrences()`, this method may spit out duplicate dates,
     * each of which are associated with a different `Schedule`. To see what
     * `Schedule` a date is associated with, you may use `DateAdapter#schedule`.
     *
     * @param args
     */
    occurrences(args = {}) {
        return new OccurrenceIterator(this, args);
    }
    // `_run()` follows in the footsteps of `Schedule#_run()`,
    // which is fully commented.
    /**  @private use collections() instead */
    *_run(args = {}) {
        let cache = this.schedules
            .map(schedule => {
            const iterator = schedule.occurrences(args);
            return {
                iterator,
                date: iterator.next().value,
            };
        })
            .filter(item => !!item.date);
        let next;
        if (cache.length === 0)
            return;
        else {
            next = selectNextUpcomingCacheObj(cache[0], cache);
        }
        let count = args.take;
        let index = 0;
        while (next.date && (count === undefined || count > index)) {
            // add the current calendar to the metadata
            next.date.calendar = this;
            yield next.date.clone();
            next.date = next.iterator.next().value;
            if (!next.date) {
                cache = cache.filter(item => item !== next);
                next = cache[0];
                if (cache.length === 0)
                    break;
            }
            next = selectNextUpcomingCacheObj(next, cache);
            index++;
        }
    }
}
function selectNextUpcomingCacheObj(current, cache) {
    if (cache.length === 1)
        return cache[0];
    return cache.reduce((prev, curr) => {
        if (!curr.date)
            return prev;
        else if (curr.date.isBefore(prev.date))
            return curr;
        else
            return prev;
    }, current);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsZW5kYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2NhbGVuZGFyL2NhbGVuZGFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFDTCxjQUFjLEVBQ2Qsa0JBQWtCLEdBSW5CLE1BQU0sZUFBZSxDQUFBO0FBQ3RCLE9BQU8sRUFBbUIsa0JBQWtCLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFDbEUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLGNBQWMsQ0FBQTtBQUdwQyxNQUFNLGVBQ0osU0FBUSxjQUFpQjtJQWlCekIsWUFBWSxPQUFvRCxFQUFFO1FBQ2hFLEtBQUssRUFBRSxDQUFBO1FBaEJGLGNBQVMsR0FBa0IsRUFBRSxDQUFBO1FBaUJsQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTthQUNyRSxJQUFJLElBQUksQ0FBQyxTQUFTO1lBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQzlELENBQUM7SUFkRCxJQUFJLFNBQVM7UUFDWCxPQUFPLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFNBQVM7YUFDeEMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQzthQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFRLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1osT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUM3RCxDQUFDO0lBUUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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