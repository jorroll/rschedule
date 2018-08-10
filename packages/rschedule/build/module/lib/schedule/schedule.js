import { RRule, RDates, EXDates } from '../rule';
import { parseICalStrings } from '../ical/parser';
import { HasOccurrences, OccurrenceIterator, } from '../interfaces';
import { Utils } from '../utilities';
export class Schedule extends HasOccurrences {
    constructor(args) {
        super();
        this.rrules = [];
        this.rdates = new RDates([]);
        this.exdates = new EXDates([]);
        if (args) {
            if (args.rrules)
                this.rrules = args.rrules.map(options => new RRule(options));
            if (args.rdates)
                this.rdates = new RDates(args.rdates);
            if (args.exdates)
                this.exdates = new EXDates(args.exdates);
        }
    }
    /**
     * The start date is the earliest RDATE or RRULE start date. The first valid
     * occurrence of the schedule does not necessarily equal the start date because
     * exdates are not taken into consideration.
     */
    get startDate() {
        const dates = this.rrules.map(rule => rule.startDate);
        dates.push(...this.rdates.dates);
        return Utils.getEarliestDate(dates);
    }
    get isInfinite() {
        return this.rrules.some(rule => rule.isInfinite);
    }
    static fromICal(icals, dateAdapterConstructor) {
        if (!Array.isArray(icals))
            icals = [icals];
        const options = parseICalStrings(icals, dateAdapterConstructor);
        return new Schedule(options);
    }
    toICal() {
        const icals = [];
        this.rrules.forEach(rule => icals.push(rule.toICal()));
        if (this.rdates.length > 0)
            icals.push(this.rdates.toICal());
        if (this.exdates.length > 0)
            icals.push(this.exdates.toICal());
        return icals;
    }
    occurrences(args = {}) {
        return new OccurrenceIterator(this, args);
    }
    /**  @private use occurrences() instead */
    *_run(args = {}) {
        // bundle RRule iterators & RDates iterator
        const positiveIterators = this.rrules.slice();
        positiveIterators.push(this.rdates);
        // extract exdates into array
        const exdates = this.exdates.dates.slice();
        // Create a cache we can iterate over.
        // The cache contains an array of objects. Each object contains an RRule
        // or RDates iterator, as well as the next upcoming date for that iterator
        let cache = positiveIterators
            .map(obj => {
            const iterator = obj.occurrences(args);
            return {
                iterator,
                date: iterator.next().value,
            };
        })
            // remove any iterators which don't have any upcoming dates from the cache
            .filter(item => !!item.date);
        let next;
        let mustFilter = false;
        // just return void if the cache is empty (indicating that this schedule has
        // no RRule / RDates objects
        if (cache.length === 0)
            return;
        else {
            // Selecting the first cache object is rather arbitrary
            // The only imporant thing is that our initial select
            //   1. has a date
            //   2. that date is not also an EXDATE
            next = getFirstIteratorCacheObj(cache, exdates);
            if (!next)
                return;
            [next, mustFilter] = getNextIteratorCacheObj(next, cache, exdates);
        }
        let count = args.take;
        let index = 0;
        // iterate over the cache objects until we run out of dates or hit our max count
        while (next.date && (count === undefined || count > index)) {
            // add this schedule to the metadata
            next.date.schedule = this;
            // yield the selected cache object's date to the user
            yield next.date.clone();
            // iterate the date on the selected cache object
            next.date = next.iterator.next().value;
            if (!next.date || mustFilter) {
                // if the selected cache object now doesn't have a date,
                // remove it from the cache and arbitrarily select another one
                cache = cache.filter(cacheObj => !!cacheObj.date);
                next = cache[0];
                // if there are no more cache objects, end iteration
                if (cache.length === 0)
                    break;
            }
            // select the next upcoming cache object from the cache
            ;
            [next, mustFilter] = getNextIteratorCacheObj(next, cache, exdates);
            index++;
        }
    }
}
/**
 * Selecting the first cache object is rather arbitrary
 * The only imporant thing is that our initial select
 *   1. has a date
 *   2. that date is not also an EXDATE
 */
function getFirstIteratorCacheObj(cache, exdates) {
    let first = cache[0];
    getNextDateThatIsNotInExdates(first, exdates);
    while (!first.date && cache.length > 1) {
        cache.shift();
        first = cache[0];
        getNextDateThatIsNotInExdates(first, exdates);
    }
    if (!first.date)
        return null;
    // remove past (i.e. no longer applicable exdates from our exdates array)
    removePastExDates(first.date, exdates);
    return first;
}
/**
 * This function gets the next item from our iterator cache and
 * also removes past (i.e. no longer applicable) exdates from our
 * exdates array.
 */
function getNextIteratorCacheObj(next, cache, exdates) {
    let mustFilter = false;
    if (cache.length === 1) {
        next = cache[0];
        getNextDateThatIsNotInExdates(next, exdates);
    }
    else {
        // don't include the `next` iterator in the cache, since it is injected into the
        // reducer as the first item
        cache = cache.filter(item => item !== next);
        // select the next upcoming cache object from the cache
        next = cache.reduce((prev, curr) => {
            if (!getNextDateThatIsNotInExdates(curr, exdates))
                return prev;
            else if (curr.date.isBefore(prev.date))
                return curr;
            else if (curr.date.isEqual(prev.date)) {
                curr.date = curr.iterator.next().value;
                // ^ curr.date could be undefined, so need to remember
                // to filter away iterators with undefiend dates later
                mustFilter = true;
                return prev;
            }
            else
                return prev;
        }, next);
    }
    // remove past (i.e. no longer applicable exdates from our exdates array)
    removePastExDates(next.date, exdates);
    return [next, mustFilter];
}
function getNextDateThatIsNotInExdates(cacheObj, exdates) {
    if (cacheObj.date && dateIsInExDates(cacheObj.date, exdates)) {
        cacheObj.date = cacheObj.iterator.next().value;
        return getNextDateThatIsNotInExdates(cacheObj, exdates);
    }
    else
        return cacheObj.date;
}
function dateIsInExDates(date, exdates) {
    for (const exdate of exdates) {
        if (date.isEqual(exdate))
            return true;
        else if (date.isAfter(exdate))
            break;
    }
    return false;
}
function removePastExDates(date, exdates) {
    if (!date)
        return;
    const exdatesToBeRemoved = [];
    for (const exdate of exdates) {
        if (date.isBeforeOrEqual(exdate))
            break;
        else if (date.isAfter(exdate))
            exdatesToBeRemoved.push(exdate);
    }
    exdatesToBeRemoved.forEach(exdate => {
        const index = exdates.indexOf(exdate);
        exdates.splice(index, 1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3NjaGVkdWxlL3NjaGVkdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBUSxNQUFNLFNBQVMsQ0FBQTtBQUV0RCxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUNqRCxPQUFPLEVBQ0wsY0FBYyxFQUtkLGtCQUFrQixHQUNuQixNQUFNLGVBQWUsQ0FBQTtBQUN0QixPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBRXBDLE1BQU0sZUFDSixTQUFRLGNBQWlCO0lBd0J6QixZQUFZLElBQTZFO1FBQ3ZGLEtBQUssRUFBRSxDQUFBO1FBdkJGLFdBQU0sR0FBZSxFQUFFLENBQUE7UUFDdkIsV0FBTSxHQUFjLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2xDLFlBQU8sR0FBZSxJQUFJLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQXNCMUMsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLElBQUksQ0FBQyxNQUFNO2dCQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO1lBQzdFLElBQUksSUFBSSxDQUFDLE1BQU07Z0JBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDdEQsSUFBSSxJQUFJLENBQUMsT0FBTztnQkFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtTQUMzRDtJQUNILENBQUM7SUF0QkQ7Ozs7T0FJRztJQUNILElBQUksU0FBUztR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