"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rschedule_1 = require("@rschedule/rschedule");
const date_fns_1 = require("date-fns");
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
class StandardDateAdapter {
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
                    throw new rschedule_1.DateAdapter.InvalidDateError('The `StandardDateAdapter` only supports datetimes in UTC or LOCAL time. ' +
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
                this.date = date_fns_1.addYears(this.date, amount);
                break;
            case 'month':
                this.date = date_fns_1.addMonths(this.date, amount);
                break;
            case 'week':
                this.date = date_fns_1.addWeeks(this.date, amount);
                break;
            case 'day':
                this.date = date_fns_1.addDays(this.date, amount);
                break;
            case 'hour':
                this.date = date_fns_1.addHours(this.date, amount);
                break;
            case 'minute':
                this.date = date_fns_1.addMinutes(this.date, amount);
                break;
            case 'second':
                this.date = date_fns_1.addSeconds(this.date, amount);
                break;
            case 'millisecond':
                this.date = date_fns_1.addMilliseconds(this.date, amount);
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
                this.date = date_fns_1.subYears(this.date, amount);
                break;
            case 'month':
                this.date = date_fns_1.subMonths(this.date, amount);
                break;
            case 'week':
                this.date = date_fns_1.subWeeks(this.date, amount);
                break;
            case 'day':
                this.date = date_fns_1.subDays(this.date, amount);
                break;
            case 'hour':
                this.date = date_fns_1.subHours(this.date, amount);
                break;
            case 'minute':
                this.date = date_fns_1.subMinutes(this.date, amount);
                break;
            case 'second':
                this.date = date_fns_1.subSeconds(this.date, amount);
                break;
            case 'millisecond':
                this.date = date_fns_1.subMilliseconds(this.date, amount);
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
                    return date_fns_1.getDayOfYear(this.date);
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
                    return date_fns_1.getDayOfYear(new Date(Date.UTC(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate())));
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
            throw new rschedule_1.DateAdapter.InvalidDateError();
        }
        return true;
    }
}
exports.StandardDateAdapter = StandardDateAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhcmQtZGF0ZS1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9zdGFuZGFyZC1kYXRlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvREFBbUQ7QUFFbkQsdUNBa0JpQjtBQUVqQixNQUFNLFFBQVEsR0FBK0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUV2Rix5QkFBeUIsR0FBVztJQUNsQyxJQUFJLEdBQUcsR0FBRyxFQUFFO1FBQUUsT0FBTyxJQUFJLEdBQUcsRUFBRSxDQUFBOztRQUN6QixPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUE7QUFDdEIsQ0FBQztBQUVELGtDQUE0RCxJQUFPO0lBQ2pFLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsZUFBZSxDQUMvRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUNoQixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxlQUFlLENBQzVGLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQ25CLEVBQUUsQ0FBQTtBQUNMLENBQUM7QUFFRDtJQVlFLFlBQVksSUFBVztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUE7UUFDOUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFBO0lBQ3RCLENBQUM7SUFFRCxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQVc7UUFDM0IsT0FBTyxNQUFNLFlBQVksbUJBQW1CLENBQUE7SUFDOUMsQ0FBQztJQUVELE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFXckI7UUFDQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMxQyxvQ0FBb0M7WUFDcEMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7WUFFN0IsUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNyQixLQUFLLEtBQUs7b0JBQ1IsZ0RBQWdEO29CQUNoRCxhQUFhO29CQUNiLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNqRSxLQUFLLFNBQVMsQ0FBQztnQkFDZixLQUFLLE1BQU07b0JBQ1QsZ0RBQWdEO29CQUNoRCxhQUFhO29CQUNiLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUE7Z0JBQ3ZEO29CQUNFLE1BQU0sSUFBSSx1QkFBVyxDQUFDLGdCQUFnQixDQUNwQywwRUFBMEU7d0JBQ3hFLGlEQUFpRCxJQUFJLENBQUMsUUFBUSxhQUFhLENBQzlFLENBQUE7YUFDSjtRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsS0FBSztRQUNILE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVELFdBQVcsQ0FBQyxNQUFXO1FBQ3JCLE9BQU8sbUJBQW1CLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQy9DLENBQUM7SUFFRCxPQUFPLENBQUMsTUFBVztRQUNqQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ2xGLENBQUM7SUFDRCxRQUFRLENBQUMsTUFBMkI7UUFDbEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7SUFDcEQsQ0FBQztJQUNELGVBQWUsQ0FBQyxNQUEyQjtRQUN6QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUNyRCxDQUFDO0lBQ0QsT0FBTyxDQUFDLE1BQTJCO1FBQ2pDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ3BELENBQUM7SUFDRCxjQUFjLENBQUMsTUFBMkI7UUFDeEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7SUFDckQsQ0FBQztJQUVELHFDQUFxQztJQUNyQyxHQUFHLENBQUMsTUFBYyxFQUFFLElBQXNCO1FBQ3hDLFFBQVEsSUFBSSxFQUFFO1lBQ1osS0FBSyxNQUFNO2dCQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUN2QyxNQUFLO1lBQ1AsS0FBSyxPQUFPO2dCQUNWLElBQUksQ0FBQyxJQUFJLEdBQUcsb0JBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUN4QyxNQUFLO1lBQ1AsS0FBSyxNQUFNO2dCQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUN2QyxNQUFLO1lBQ1AsS0FBSyxLQUFLO2dCQUNSLElBQUksQ0FBQyxJQUFJLEdBQUcsa0JBQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUN0QyxNQUFLO1lBQ1AsS0FBSyxNQUFNO2dCQUNULElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUN2QyxNQUFLO1lBQ1AsS0FBSyxRQUFRO2dCQUNYLElBQUksQ0FBQyxJQUFJLEdBQUcscUJBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUN6QyxNQUFLO1lBQ1AsS0FBSyxRQUFRO2dCQUNYLElBQUksQ0FBQyxJQUFJLEdBQUcscUJBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUN6QyxNQUFLO1lBQ1AsS0FBSyxhQUFhO2dCQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLDBCQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDOUMsTUFBSztZQUNQO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQTtTQUN4RTtRQUVELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtRQUVwQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxxQ0FBcUM7SUFDckMsUUFBUSxDQUFDLE1BQWMsRUFBRSxJQUFzQjtRQUM3QyxRQUFRLElBQUksRUFBRTtZQUNaLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDdkMsTUFBSztZQUNQLEtBQUssT0FBTztnQkFDVixJQUFJLENBQUMsSUFBSSxHQUFHLG9CQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDeEMsTUFBSztZQUNQLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDdkMsTUFBSztZQUNQLEtBQUssS0FBSztnQkFDUixJQUFJLENBQUMsSUFBSSxHQUFHLGtCQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDdEMsTUFBSztZQUNQLEtBQUssTUFBTTtnQkFDVCxJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDdkMsTUFBSztZQUNQLEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsSUFBSSxHQUFHLHFCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDekMsTUFBSztZQUNQLEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsSUFBSSxHQUFHLHFCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDekMsTUFBSztZQUNQLEtBQUssYUFBYTtnQkFDaEIsSUFBSSxDQUFDLElBQUksR0FBRywwQkFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7Z0JBQzlDLE1BQUs7WUFDUDtnQkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUE7U0FDN0U7UUFFRCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUE7UUFFcEIsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBY0QsR0FBRyxDQUNELElBWWM7UUFFZCxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFO1lBQy9CLFFBQVEsSUFBSSxFQUFFO2dCQUNaLEtBQUssTUFBTTtvQkFDVCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7Z0JBQ2hDLEtBQUssT0FBTztvQkFDVixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUNqQyxLQUFLLFNBQVM7b0JBQ1osT0FBTyx1QkFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDaEMsS0FBSyxTQUFTO29CQUNaLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQTtnQkFDckMsS0FBSyxLQUFLO29CQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtnQkFDNUIsS0FBSyxNQUFNO29CQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtnQkFDN0IsS0FBSyxRQUFRO29CQUNYLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtnQkFDL0IsS0FBSyxRQUFRO29CQUNYLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtnQkFDL0IsS0FBSyxhQUFhO29CQUNoQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7Z0JBQ3BDLEtBQUssU0FBUztvQkFDWixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7Z0JBQzVCLEtBQUssVUFBVTtvQkFDYixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUE7Z0JBQzNDLEtBQUssVUFBVTtvQkFDYixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUE7Z0JBQ3RCO29CQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQTthQUN4RTtTQUNGO2FBQU07WUFDTCxRQUFRLElBQUksRUFBRTtnQkFDWixLQUFLLE1BQU07b0JBQ1QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO2dCQUNuQyxLQUFLLE9BQU87b0JBQ1YsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDcEMsS0FBSyxTQUFTO29CQUNaLE9BQU8sdUJBQVksQ0FDakIsSUFBSSxJQUFJLENBQ04sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUN0RixDQUNGLENBQUE7Z0JBQ0gsS0FBSyxTQUFTO29CQUNaLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtnQkFDeEMsS0FBSyxLQUFLO29CQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtnQkFDL0IsS0FBSyxNQUFNO29CQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtnQkFDaEMsS0FBSyxRQUFRO29CQUNYLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtnQkFDbEMsS0FBSyxRQUFRO29CQUNYLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQTtnQkFDbEMsS0FBSyxhQUFhO29CQUNoQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtnQkFDdkMsS0FBSyxTQUFTO29CQUNaLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtnQkFDNUIsS0FBSyxVQUFVO29CQUNiLE9BQU8sQ0FBQyxDQUFBO2dCQUNWLEtBQUssVUFBVTtvQkFDYixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUE7Z0JBQ3RCO29CQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQTthQUN4RTtTQUNGO0lBQ0gsQ0FBQztJQUlELEdBQUcsQ0FBQyxJQUFtQyxFQUFFLEtBQWlDO1FBQ3hFLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDL0IsUUFBUSxJQUFJLEVBQUU7Z0JBQ1osS0FBSyxNQUFNO29CQUNULElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQWUsQ0FBQyxDQUFBO29CQUN0QyxNQUFLO2dCQUNQLEtBQUssT0FBTztvQkFDVixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBRSxLQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFBO29CQUN6QyxNQUFLO2dCQUNQLEtBQUssS0FBSztvQkFDUixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFlLENBQUMsQ0FBQTtvQkFDbEMsTUFBSztnQkFDUCxLQUFLLE1BQU07b0JBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBZSxDQUFDLENBQUE7b0JBQ25DLE1BQUs7Z0JBQ1AsS0FBSyxRQUFRO29CQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQWUsQ0FBQyxDQUFBO29CQUNyQyxNQUFLO2dCQUNQLEtBQUssUUFBUTtvQkFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFlLENBQUMsQ0FBQTtvQkFDckMsTUFBSztnQkFDUCxLQUFLLGFBQWE7b0JBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQWUsQ0FBQyxDQUFBO29CQUMxQyxNQUFLO2dCQUNQLEtBQUssVUFBVTtvQkFDYixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQTBCLENBQUE7b0JBQzFDLE1BQUs7Z0JBQ1A7b0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFBO2FBQ3hFO1NBQ0Y7YUFBTTtZQUNMLFFBQVEsSUFBSSxFQUFFO2dCQUNaLEtBQUssTUFBTTtvQkFDVCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFlLENBQUMsQ0FBQTtvQkFDekMsTUFBSztnQkFDUCxLQUFLLE9BQU87b0JBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUUsS0FBZ0IsR0FBRyxDQUFDLENBQUMsQ0FBQTtvQkFDNUMsTUFBSztnQkFDUCxLQUFLLEtBQUs7b0JBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBZSxDQUFDLENBQUE7b0JBQ3JDLE1BQUs7Z0JBQ1AsS0FBSyxNQUFNO29CQUNULElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQWUsQ0FBQyxDQUFBO29CQUN0QyxNQUFLO2dCQUNQLEtBQUssUUFBUTtvQkFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFlLENBQUMsQ0FBQTtvQkFDeEMsTUFBSztnQkFDUCxLQUFLLFFBQVE7b0JBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBZSxDQUFDLENBQUE7b0JBQ3hDLE1BQUs7Z0JBQ1AsS0FBSyxhQUFhO29CQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQWUsQ0FBQyxDQUFBO29CQUM3QyxNQUFLO2dCQUNQLEtBQUssVUFBVTtvQkFDYixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQTBCLENBQUE7b0JBQzFDLE1BQUs7Z0JBQ1A7b0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFBO2FBQ3hFO1NBQ0Y7UUFFRCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUE7UUFFcEIsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUNoQyxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQWE7UUFDbEIsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLO1lBQ2hDLE9BQU8sR0FBRyx3QkFBd0IsQ0FBQyxJQUEyQixDQUFDLEdBQUcsQ0FBQTs7WUFDL0QsT0FBTyxHQUFHLHdCQUF3QixDQUFDLElBQTJCLENBQUMsRUFBRSxDQUFBO0lBQ3hFLENBQUM7SUFFRCxhQUFhO1FBQ1gsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUM3RSxNQUFNLElBQUksdUJBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1NBQ3pDO1FBRUQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0NBQ0Y7QUEzVUQsa0RBMlVDIn0=