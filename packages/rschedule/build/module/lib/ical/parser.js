import { Utils } from '../utilities';
export class ICalStringParseError extends Error {
}
const UNIMPLEMENTED_RULE_OPTION = 'rule option is unsupported by rSchedule ' +
    'and I have no plans to implement it. Pull requests are welcome though.';
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
export function parseICalStrings(icalStrings, dateAdapterConstructor) {
    const rrules = [];
    const rdates = [];
    const exdates = [];
    icalStrings.forEach(ical => {
        const parts = ical.split('\n');
        const dtstart = dateAdapterConstructor.fromTimeObject(parseDTStart(parts.shift()))[0];
        parts.forEach(part => {
            const parts = part.split(':');
            const name = parts[0];
            if (name === 'RRULE') {
                const options = parts[1].split(';').map(op => op.split('='));
                const parsedOptions = {
                    start: dtstart,
                };
                options.forEach(option => {
                    switch (option[0]) {
                        case 'FREQ':
                            parsedOptions.frequency = parseFrequency(option[1]);
                            break;
                        case 'UNTIL':
                            parsedOptions.until = parseUntil(option[1], dateAdapterConstructor, dtstart);
                            break;
                        case 'COUNT':
                            parsedOptions.count = parseCount(option[1]);
                            break;
                        case 'INTERVAL':
                            parsedOptions.interval = parseInterval(option[1]);
                            break;
                        case 'BYSECOND':
                            parsedOptions.bySecondOfMinute = parseBySecond(option[1]);
                            break;
                        case 'BYMINUTE':
                            parsedOptions.byMinuteOfHour = parseByMinute(option[1]);
                            break;
                        case 'BYHOUR':
                            parsedOptions.byHourOfDay = parseByHour(option[1]);
                            break;
                        case 'BYDAY':
                            parsedOptions.byDayOfWeek = parseByDay(option[1]);
                            break;
                        case 'BYMONTHDAY':
                            parsedOptions.byDayOfMonth = parseByMonthDay(option[1]);
                            break;
                        case 'BYYEARDAY':
                            throw new ICalStringParseError(`"BYYEARDAY" ${UNIMPLEMENTED_RULE_OPTION}`);
                        case 'BYWEEKNO':
                            throw new ICalStringParseError(`"BYWEEKNO" ${UNIMPLEMENTED_RULE_OPTION}`);
                        case 'BYMONTH':
                            parsedOptions.byMonthOfYear = parseByMonth(option[1]);
                            break;
                        case 'BYSETPOS':
                            throw new ICalStringParseError(`"BYSETPOS" ${UNIMPLEMENTED_RULE_OPTION}`);
                        case 'WKST':
                            parsedOptions.weekStart = parseWkst(option[1]);
                            break;
                        default:
                            throw new ICalStringParseError(`Unknown ICAL rule "${option[0]}"`);
                    }
                });
                rrules.push(parsedOptions);
            }
            else if (name === 'RDATE') {
                const time = dateAdapterConstructor.fromTimeObject(parseDatetime(parts[1]));
                rdates.push(...time);
            }
            else if (name === 'EXDATE') {
                const time = dateAdapterConstructor.fromTimeObject(parseDatetime(parts[1]));
                exdates.push(...time);
            }
            else {
                throw new ICalStringParseError(`Unsupported ICAL part "${name}"`);
            }
        });
    });
    return {
        rdates,
        exdates,
        rrules,
    };
}
/**
 * This function accepts the DTSTART portion of an ICAL string
 * and returns an object containing the `time`, broken up into an array
 * of `[YYYY, MM, DD, HH, MM, SS]`, the `timezone`, if applicable, and
 * the `raw` DTSTART text.
 *
 * If it encounters a parsing error, a `ICalStringParseError` will be thrown.
 *
 * @param text The DTSTART portion of an ICAL string
 */
export function parseDTStart(text) {
    const parts = text && text.substring(0, 7);
    try {
        if (parts !== 'DTSTART')
            throw '';
        const timeObj = parseDatetime(text.substring(8));
        if (timeObj.datetimes.length !== 1)
            throw '';
        return timeObj;
    }
    catch (e) {
        throw new ICalStringParseError(`Invalid "DTSTART" value "${text}"`);
    }
}
/**
 * This function parses an ICAL time string, throwing a `ICalStringParseError`
 * if it runs into problems, and returns an object with three properties:
 *
 * 1. `datetimes`: an array of parsed time values each in
 *   `[YYYY, MM, DD, HH, MM, SS]` format, where `HH`, `MM`, and `SS`
 *   may be `undefined`.
 * 2. `timezone`: the timezone all of the datetimes are in.
 *   - If local timezone: `undefined`
 *   - If UTC timezone: `"UTC"`
 *   - If the datetime is a DATE: `"DATE"`
 *   - Else: contains the ICAL formatted timezone (e.g. `"America/New_York"`)
 * 3. `raw`: The raw ICAL time string
 *
 * @param text the raw ICAL time text
 */
export function parseDatetime(text) {
    const parts = text.split(':');
    let unparsedTime;
    let datetimes;
    let timezone;
    try {
        if (parts.length === 1) {
            // no TZID / value part
            timezone = parts[0].search('Z') !== -1 ? 'UTC' : undefined;
            unparsedTime = parts[0].split('Z')[0];
        }
        else {
            // has TZID part
            const timeLabel = parts[0].split('=');
            if (timeLabel.length !== 2)
                throw '';
            else if (timeLabel[0] === 'TZID') {
                timezone = timeLabel[1];
                unparsedTime = parts[1];
            }
            else if (timeLabel[0] === 'value' && timeLabel[1] === 'date') {
                timezone = 'DATE';
                unparsedTime = parts[1];
            }
            else
                throw '';
        }
        datetimes = unparsedTime.split(',').map(time => {
            const newTime = time.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
            newTime && newTime.shift();
            if (newTime)
                return newTime.map(str => parseInt(str));
            else
                throw '';
        });
    }
    catch (e) {
        throw new ICalStringParseError(`Invalid ICAL date/time string "${text}"`);
    }
    return { datetimes, timezone, raw: text };
}
export function parseFrequency(text) {
    if (!['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(text))
        throw new ICalStringParseError(`Invalid FREQ value "${text}"`);
    else {
        return text;
    }
}
// Here we say that the type `T` must be a constructor that returns a DateAdapter
// complient type
export function parseUntil(text, dateAdapterConstructor, start) {
    const parsedDatetime = parseDatetime(text);
    if (parsedDatetime.datetimes.length !== 1)
        throw new ICalStringParseError(`Invalid UNTIL value "${text}"`);
    const date = dateAdapterConstructor.fromTimeObject(parsedDatetime)[0];
    date.set('timezone', start.get('timezone'));
    return date;
}
export function parseCount(text) {
    const int = parseInt(text);
    if (typeof int !== 'number' || isNaN(int))
        throw new ICalStringParseError(`Invalid COUNT value "${text}"`);
    return int;
}
export function parseInterval(text) {
    const int = parseInt(text);
    if (typeof int !== 'number' || isNaN(int))
        throw new ICalStringParseError(`Invalid INTERVAL value "${text}"`);
    return int;
}
export function parseBySecond(text) {
    return text.split(',').map(text => {
        const int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError(`Invalid BYSECOND value "${text}"`);
        return int;
    });
}
export function parseByMinute(text) {
    return text.split(',').map(text => {
        const int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError(`Invalid BYMINUTE value "${text}"`);
        return int;
    });
}
export function parseByHour(text) {
    return text.split(',').map(text => {
        const int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError(`Invalid BYHOUR value "${text}"`);
        return int;
    });
}
export function parseByDay(text) {
    return text.split(',').map(text => {
        text = text.trim();
        if (text.length > 2 && text.length < 5) {
            let number;
            let weekday;
            if (text[0] === '-') {
                number = parseInt(text.slice(0, 2));
                weekday = text.slice(2);
            }
            else {
                number = parseInt(text[0]);
                weekday = text.slice(1);
            }
            if (!Utils.weekdays.includes(weekday)) {
                throw new ICalStringParseError(`Invalid BYDAY value "${text}"`);
            }
            return [weekday, number];
        }
        else if (!Utils.weekdays.includes(text)) {
            throw new ICalStringParseError(`Invalid BYDAY value "${text}"`);
        }
        else {
            return text;
        }
    });
}
export function parseByMonthDay(text) {
    return text.split(',').map(text => {
        const int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError(`Invalid BYMONTHDAY value "${text}"`);
        return int;
    });
}
export function parseByMonth(text) {
    return text.split(',').map(text => {
        const int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError(`Invalid BYMONTH value "${text}"`);
        return int;
    });
}
export function parseWkst(text) {
    if (!Utils.weekdays.includes(text)) {
        throw new ICalStringParseError(`Invalid WKST value "${text}"`);
    }
    return text;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9pY2FsL3BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBRXBDLE1BQU0sMkJBQTRCLFNBQVEsS0FBSztDQUFHO0FBRWxELE1BQU0seUJBQXlCLEdBQzdCLDBDQUEwQztJQUMxQyx3RUFBd0UsQ0FBQTtBQUUxRTs7Ozs7Ozs7OztHQVVHO0FBRUgsTUFBTSwyQkFJSixXQUFxQixFQUNyQixzQkFBa0Q7SUFNbEQsTUFBTSxNQUFNLEdBQWlDLEVBQUUsQ0FBQTtJQUMvQyxNQUFNLE1BQU0sR0FBUSxFQUFFLENBQUE7SUFDdEIsTUFBTSxPQUFPLEdBQVEsRUFBRSxDQUFBO0lBRXZCLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDekIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM5QixNQUFNLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFckYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNuQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzdCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUVyQixJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7Z0JBQ3BCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FB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