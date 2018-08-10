import { DateAdapter } from '@rschedule/rschedule';
import { addDays, addWeeks, addMonths, addSeconds, addMinutes, addHours, addYears, subYears, subMonths, subWeeks, subDays, subHours, subMinutes, subSeconds, getDayOfYear, addMilliseconds, subMilliseconds, } from 'date-fns';
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
function toTwoCharString(int) {
    if (int < 10)
        return `0${int}`;
    else
        return `${int}`;
}
function dateToStandardizedString(date) {
    return `${date.get('year')}${toTwoCharString(date.get('month'))}${toTwoCharString(date.get('day'))}T${toTwoCharString(date.get('hour'))}${toTwoCharString(date.get('minute'))}${toTwoCharString(date.get('second'))}`;
}
export class StandardDateAdapter {
    constructor(date) {
        this.date = date ? new Date(date) : new Date();
        this.assertIsValid();
    }
    static isInstance(object) {
        return object instanceof StandardDateAdapter;
    }
    static fromTimeObject(args) {
        const dates = args.datetimes.map(datetime => {
            // adjust for `Date`'s base-0 months
            datetime[1] = datetime[1] - 1;
            switch (args.timezone) {
                case 'UTC':
                    // TS doesn't like my use of the spread operator
                    // @ts-ignore
                    return new StandardDateAdapter(new Date(Date.UTC(...datetime)));
                case undefined:
                case 'DATE':
                    // TS doesn't like my use of the spread operator
                    // @ts-ignore
                    return new StandardDateAdapter(new Date(...datetime));
                default:
                    throw new DateAdapter.InvalidDateError('The `StandardDateAdapter` only supports datetimes in UTC or LOCAL time. ' +
                        `You attempted to parse an ICAL string with a "${args.timezone}" timezone.`);
            }
        });
        return dates;
    }
    clone() {
        return new StandardDateAdapter(this.date);
    }
    isSameClass(object) {
        return StandardDateAdapter.isInstance(object);
    }
    isEqual(object) {
        return this.isSameClass(object) && object.date.valueOf() === this.date.valueOf();
    }
    isBefore(object) {
        return this.date.valueOf() < object.date.valueOf();
    }
    isBeforeOrEqual(object) {
        return this.date.valueOf() <= object.date.valueOf();
    }
    isAfter(object) {
        return this.date.valueOf() > object.date.valueOf();
    }
    isAfterOrEqual(object) {
        return this.date.valueOf() >= object.date.valueOf();
    }
    // clones date before manipulating it
    add(amount, unit) {
        switch (unit) {
            case 'year':
                this.date = addYears(this.date, amount);
                break;
            case 'month':
                this.date = addMonths(this.date, amount);
                break;
            case 'week':
                this.date = addWeeks(this.date, amount);
                break;
            case 'day':
                this.date = addDays(this.date, amount);
                break;
            case 'hour':
                this.date = addHours(this.date, amount);
                break;
            case 'minute':
                this.date = addMinutes(this.date, amount);
                break;
            case 'second':
                this.date = addSeconds(this.date, amount);
                break;
            case 'millisecond':
                this.date = addMilliseconds(this.date, amount);
                break;
            default:
                throw new Error('Invalid unit provided to `StandardDateAdapter#add`');
        }
        this.assertIsValid();
        return this;
    }
    // clones date before manipulating it
    subtract(amount, unit) {
        switch (unit) {
            case 'year':
                this.date = subYears(this.date, amount);
                break;
            case 'month':
                this.date = subMonths(this.date, amount);
                break;
            case 'week':
                this.date = subWeeks(this.date, amount);
                break;
            case 'day':
                this.date = subDays(this.date, amount);
                break;
            case 'hour':
                this.date = subHours(this.date, amount);
                break;
            case 'minute':
                this.date = subMinutes(this.date, amount);
                break;
            case 'second':
                this.date = subSeconds(this.date, amount);
                break;
            case 'millisecond':
                this.date = subMilliseconds(this.date, amount);
                break;
            default:
                throw new Error('Invalid unit provided to `StandardDateAdapter#subtract`');
        }
        this.assertIsValid();
        return this;
    }
    get(unit) {
        if (this.timezone === undefined) {
            switch (unit) {
                case 'year':
                    return this.date.getFullYear();
                case 'month':
                    return this.date.getMonth() + 1;
                case 'yearday':
                    return getDayOfYear(this.date);
                case 'weekday':
                    return WEEKDAYS[this.date.getDay()];
                case 'day':
                    return this.date.getDate();
                case 'hour':
                    return this.date.getHours();
                case 'minute':
                    return this.date.getMinutes();
                case 'second':
                    return this.date.getSeconds();
                case 'millisecond':
                    return this.date.getMilliseconds();
                case 'ordinal':
                    return this.date.valueOf();
                case 'tzoffset':
                    return this.date.getTimezoneOffset() * 60;
                case 'timezone':
                    return this.timezone;
                default:
                    throw new Error('Invalid unit provided to `StandardDateAdapter#set`');
            }
        }
        else {
            switch (unit) {
                case 'year':
                    return this.date.getUTCFullYear();
                case 'month':
                    return this.date.getUTCMonth() + 1;
                case 'yearday':
                    return getDayOfYear(new Date(Date.UTC(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate())));
                case 'weekday':
                    return WEEKDAYS[this.date.getUTCDay()];
                case 'day':
                    return this.date.getUTCDate();
                case 'hour':
                    return this.date.getUTCHours();
                case 'minute':
                    return this.date.getUTCMinutes();
                case 'second':
                    return this.date.getUTCSeconds();
                case 'millisecond':
                    return this.date.getUTCMilliseconds();
                case 'ordinal':
                    return this.date.valueOf();
                case 'tzoffset':
                    return 0;
                case 'timezone':
                    return this.timezone;
                default:
                    throw new Error('Invalid unit provided to `StandardDateAdapter#set`');
            }
        }
    }
    set(unit, value) {
        if (this.timezone === undefined) {
            switch (unit) {
                case 'year':
                    this.date.setFullYear(value);
                    break;
                case 'month':
                    this.date.setMonth(value - 1);
                    break;
                case 'day':
                    this.date.setDate(value);
                    break;
                case 'hour':
                    this.date.setHours(value);
                    break;
                case 'minute':
                    this.date.setMinutes(value);
                    break;
                case 'second':
                    this.date.setSeconds(value);
                    break;
                case 'millisecond':
                    this.date.setMilliseconds(value);
                    break;
                case 'timezone':
                    this.timezone = value;
                    break;
                default:
                    throw new Error('Invalid unit provided to `StandardDateAdapter#set`');
            }
        }
        else {
            switch (unit) {
                case 'year':
                    this.date.setUTCFullYear(value);
                    break;
                case 'month':
                    this.date.setUTCMonth(value - 1);
                    break;
                case 'day':
                    this.date.setUTCDate(value);
                    break;
                case 'hour':
                    this.date.setUTCHours(value);
                    break;
                case 'minute':
                    this.date.setUTCMinutes(value);
                    break;
                case 'second':
                    this.date.setUTCSeconds(value);
                    break;
                case 'millisecond':
                    this.date.setUTCMilliseconds(value);
                    break;
                case 'timezone':
                    this.timezone = value;
                    break;
                default:
                    throw new Error('Invalid unit provided to `StandardDateAdapter#set`');
            }
        }
        this.assertIsValid();
        return this;
    }
    toISOString() {
        return this.date.toISOString();
    }
    toICal(utc) {
        if (utc || this.timezone === 'UTC')
            return `${dateToStandardizedString(this)}Z`;
        else
            return `${dateToStandardizedString(this)}`;
    }
    assertIsValid() {
        if (isNaN(this.date.valueOf()) || !['UTC', undefined].includes(this.timezone)) {
            throw new DateAdapter.InvalidDateError();
        }
        return true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhcmQtZGF0ZS1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9zdGFuZGFyZC1kYXRlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBRW5ELE9BQU8sRUFDTCxPQUFPLEVBQ1AsUUFBUSxFQUNSLFNBQVMsRUFDVCxVQUFVLEVBQ1YsVUFBVSxFQUNWLFFBQVEsRUFDUixRQUFRLEVBQ1IsUUFBUSxFQUNSLFNBQVMsRUFDVCxRQUFRLEVBQ1IsT0FBTyxFQUNQLFFBQVEsRUFDUixVQUFVLEVBQ1YsVUFBVSxFQUNWLFlBQVksRUFDWixlQUFlLEVBQ2YsZUFBZSxHQUNoQixNQUFNLFVBQVUsQ0FBQTtBQUVqQixNQUFNLFFBQVEsR0FBK0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUV2Rix5QkFBeUIsR0FBVztJQUNsQyxJQUFJLEdBQUcsR0FBRyxFQUFFO1FBQUUsT0FBTyxJQUFJLEdBQUcsRUFBRSxDQUFBOztRQUN6QixPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUE7QUFDdEIsQ0FBQztBQUVELGtDQUE0RCxJQUFPO0lBQ2pFLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsZUFBZSxDQUMvRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUNoQixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxlQUFlLENBQzVGLElBQUksQ0FBQyxHQUFH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