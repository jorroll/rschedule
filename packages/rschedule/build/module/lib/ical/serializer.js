import { Utils } from '../utilities';
import { buildValidatedRuleOptions } from '../rule/rule-options';
export class ICalStringSerialzeError extends Error {
}
/**
 * Parses an array of ICAL strings and returns an object containing
 * `rrules`, `exrules`, `rdates`, and `exdates`. The `rrules` and `exrules`
 * properties contain `ProvidedOptions` objects and the `rdates` and `exdates`
 * properties contain `DateAdapter` objects built with a `DateAdapter`
 * constructor you provide. `parseICalStrings` will use the date adapter constructor's
 * `fromTimeObject` static method to instantiate new instances.
 *
 * @param icalStrings
 * @param dateAdapterConstructor
 */
export function ruleOptionsToIcalString(options, type = 'RRULE') {
    // First validate options object, but don't use the result
    buildValidatedRuleOptions(options);
    let icalString;
    const start = options.start;
    icalString = `DTSTART:${start.toICal()}\n${type}:`;
    const stringOptions = [];
    for (const option in options) {
        if (options.hasOwnProperty(option)) {
            switch (option) {
                case 'frequency':
                    stringOptions.push(`FREQ=${options.frequency}`);
                    break;
                case 'interval':
                    stringOptions.push(`INTERVAL=${options.interval}`);
                    break;
                case 'until':
                    stringOptions.push(`UNTIL=${options.until.toICal(!!start.get('timezone'))}`);
                    break;
                case 'count':
                    stringOptions.push(`COUNT=${options.count}`);
                    break;
                case 'bySecondOfMinute':
                    stringOptions.push(`BYSECOND=${options.bySecondOfMinute.join(',')}`);
                    break;
                case 'byMinuteOfHour':
                    stringOptions.push(`BYMINUTE=${options.byMinuteOfHour.join(',')}`);
                    break;
                case 'byHourOfDay':
                    stringOptions.push(`BYHOUR=${options.byHourOfDay.join(',')}`);
                    break;
                case 'byDayOfWeek':
                    stringOptions.push(`BYDAY=${serializeByDayOfWeek(options.byDayOfWeek)}`);
                    break;
                case 'byDayOfMonth':
                    stringOptions.push(`BYMONTHDAY=${options.byDayOfMonth.join(',')}`);
                    break;
                case 'byMonthOfYear':
                    stringOptions.push(`BYMONTH=${options.byMonthOfYear.join(',')}`);
                    break;
                case 'weekStart':
                    stringOptions.push(`WKST=${options.weekStart}`);
                    break;
            }
        }
    }
    return icalString.concat(stringOptions.join(';'));
}
function serializeByDayOfWeek(args) {
    return args.map(arg => (Array.isArray(arg) ? `${arg[1]}${arg[0]}` : arg)).join(',');
}
/**
 * Converts an array of dates into an ICAL string containing RDATEs.
 * All dates must be in the same timezone.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
export function datesToIcalString(dates, type = 'RDATE') {
    if (dates.length === 0)
        throw new ICalStringSerialzeError('`datesToIcalString()` must recieve at least one date');
    let icalString;
    dates.sort((a, b) => {
        if (a.isAfter(b))
            return 1;
        else if (b.isAfter(a))
            return -1;
        else
            return 0;
    });
    const start = dates[0];
    const seperator = [undefined, 'UTC'].includes(start.get('timezone')) ? ':' : ';';
    icalString = `DTSTART:${start.toICal()}\n${type}${seperator}`;
    return icalString.concat(dates.map(date => date.toICal()).join(','));
}
export function dateAdapterToICal(date, utc) {
    const timezone = utc ? 'UTC' : date.get('timezone');
    switch (timezone) {
        case undefined:
            return `${Utils.dateToStandardizedString(date)}`;
        case 'UTC':
            return `${Utils.dateToStandardizedString(date)}Z`;
        default:
            return `TZID=${date.get('timezone')}:${Utils.dateToStandardizedString(date)}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvaWNhbC9zZXJpYWxpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFFcEMsT0FBTyxFQUFXLHlCQUF5QixFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFFekUsTUFBTSw4QkFBK0IsU0FBUSxLQUFLO0NBQUc7QUFFckQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sa0NBQ0osT0FBbUMsRUFDbkMsT0FBMkIsT0FBTztJQUVsQywwREFBMEQ7SUFDMUQseUJBQXlCLENBQUMsT0FBTyxDQUFDLENBQUE7SUFFbEMsSUFBSSxVQUFrQixDQUFBO0lBRXRCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUE7SUFFM0IsVUFBVSxHQUFHLFdBQVcsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLElBQUksR0FBRyxDQUFBO0lBRWxELE1BQU0sYUFBYSxHQUFhLEVBQUUsQ0FBQTtJQUVsQyxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtRQUM1QixJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDbEMsUUFBUSxNQUFNLEVBQUU7Z0JBQ2QsS0FBSyxXQUFXO29CQUNkLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtvQkFDL0MsTUFBSztnQkFDUCxLQUFLLFVBQVU7b0JBQ2IsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO29CQUNsRCxNQUFLO2dCQUNQLEtBQUssT0FBTztvQkFDVixhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsT0FBTyxDQUFDLEtBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxD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