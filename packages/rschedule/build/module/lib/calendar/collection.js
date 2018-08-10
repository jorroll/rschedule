import { Utils } from '../utilities';
export class Collection {
    constructor(dates = [], period, periodStart, periodEnd) {
        this.dates = dates;
        this.period = period;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
    }
}
export class CollectionIterator {
    constructor(iterable, args) {
        this.iterable = iterable;
        this.args = args;
        this.granularity = 'INSTANTANIOUSLY';
        this[Symbol.iterator] = () => this.iterateCollection(this.iterator);
        ;
        [this.iterator, this.startDate] = this.getIterator(iterable, args);
        if (args.granularity)
            this.granularity = args.granularity;
        if (args.weekStart)
            this.weekStart = args.weekStart;
    }
    *iterateCollection(iterator) {
        if (!this.startDate)
            return;
        let date = iterator.next().value;
        if (!date)
            return;
        let periodStart = this.getPeriodStart(date);
        let periodEnd = this.getPeriodEnd(periodStart);
        let dates = [];
        let index = 0;
        while (date && (this.args.take === undefined || this.args.take > index)) {
            while (date && date.isBeforeOrEqual(periodEnd)) {
                dates.push(date);
                date = iterator.next().value;
            }
            yield new Collection(dates, this.granularity, periodStart.clone(), periodEnd.clone());
            if (!date)
                return;
            dates = [];
            periodStart = this.getPeriodStart(date);
            periodEnd = this.getPeriodEnd(periodStart);
            index++;
        }
    }
    next() {
        return this.iterateCollection(this.iterator).next();
    }
    /**
     * While `next()` and `[Symbol.iterator]` both share state,
     * `toArray()` does not share state and always returns the whole
     * collections array (or `undefined`, in the case of collection of
     * infinite length)
     */
    toArray() {
        if (!this.args.end && !this.args.take && this.iterable.isInfinite)
            return undefined;
        else {
            const collections = [];
            const [iterator] = this.getIterator(this.iterable, this.args);
            for (const collection of this.iterateCollection(iterator)) {
                collections.push(collection);
            }
            return collections;
        }
    }
    getPeriodStart(date) {
        date = date.clone();
        switch (this.granularity) {
            case 'YEARLY':
                return date.set('month', 1).set('day', 1);
            case 'MONTHLY':
                return date.set('day', 1);
            case 'WEEKLY':
                if (!this.weekStart)
                    throw new Error('"WEEKLY" granularity requires `weekStart` arg');
                const differenceFromWeekStart = Utils.weekdayToInt(date.get('weekday'), this.weekStart);
                date.subtract(differenceFromWeekStart, 'day');
            case 'DAILY':
                return date
                    .set('hour', 0)
                    .set('minute', 0)
                    .set('second', 0)
                    .set('millisecond', 0);
            case 'HOURLY':
                return date
                    .set('minute', 0)
                    .set('second', 0)
                    .set('millisecond', 0);
            case 'MINUTELY':
                return date.set('second', 0).set('millisecond', 0);
            case 'SECONDLY':
                return date.set('millisecond', 0);
            case 'INSTANTANIOUSLY':
            default:
                return date;
        }
    }
    getPeriodEnd(start) {
        let periodEnd = start.clone();
        switch (this.granularity) {
            case 'YEARLY':
                return periodEnd.add(1, 'year').subtract(1, 'millisecond');
            case 'MONTHLY':
                return periodEnd.add(1, 'month').subtract(1, 'millisecond');
            case 'WEEKLY':
                return periodEnd.add(7, 'day').subtract(1, 'millisecond');
            case 'DAILY':
                return periodEnd.add(1, 'day').subtract(1, 'millisecond');
            case 'HOURLY':
                return periodEnd.add(1, 'hour').subtract(1, 'millisecond');
            case 'MINUTELY':
                return periodEnd.add(1, 'minute').subtract(1, 'millisecond');
            case 'SECONDLY':
                return periodEnd.add(1, 'second').subtract(1, 'millisecond');
            case 'INSTANTANIOUSLY':
            default:
                return periodEnd;
        }
    }
    getIterator(iterable, args) {
        let start = args.start || iterable.startDate;
        if (!start)
            return [iterable._run(args), null];
        start = this.getPeriodStart(start);
        return [
            iterable._run({
                start,
                end: args.end,
            }),
            start,
        ];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvY2FsZW5kYXIvY29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBRXBDLE1BQU07SUFDSixZQUNrQixRQUFhLEVBQUUsRUFDZixNQUE2QyxFQUM3QyxXQUFjLEVBQ2QsU0FBWTtRQUhaLFVBQUssR0FBTCxLQUFLLENBQVU7UUFDZixXQUFNLEdBQU4sTUFBTSxDQUF1QztRQUM3QyxnQkFBVyxHQUFYLFdBQVcsQ0FBRztRQUNkLGNBQVMsR0FBVCxTQUFTLENBQUc7SUFDM0IsQ0FBQztDQUNMO0FBWUQsTUFBTTtJQU1KLFlBQW9CLFFBQVcsRUFBVSxJQUF3QjtRQUE3QyxhQUFRLEdBQVIsUUFBUSxDQUFHO1FBQVUsU0FBSSxHQUFKLElBQUksQ0FBb0I7UUFKakQsZ0JBQVcsR0FBMkIsaUJBQWlCLENBQUE7UUFXdkUsS0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQU45RCxDQUFDO1FBQUEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUVuRSxJQUFJLElBQUksQ0FBQyxXQUFXO1lBQUUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO1FBQ3pELElBQUksSUFBSSxDQUFDLFNBQVM7WUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7SUFDckQsQ0FBQztJQUlELENBQUMsaUJBQWlCLENBQUMsUUFBNkI7UUFDOUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTO1lBQUUs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