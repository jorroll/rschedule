"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var utilities_1 = require("../utilities");
var ICalStringParseError = /** @class */ (function (_super) {
    __extends(ICalStringParseError, _super);
    function ICalStringParseError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ICalStringParseError;
}(Error));
exports.ICalStringParseError = ICalStringParseError;
var UNIMPLEMENTED_RULE_OPTION = 'rule option is unsupported by rSchedule ' +
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
function parseICalStrings(icalStrings, dateAdapterConstructor) {
    var rrules = [];
    var rdates = [];
    var exdates = [];
    icalStrings.forEach(function (ical) {
        var parts = ical.split('\n');
        var dtstart = dateAdapterConstructor.fromTimeObject(parseDTStart(parts.shift()))[0];
        parts.forEach(function (part) {
            var parts = part.split(':');
            var name = parts[0];
            if (name === 'RRULE') {
                var options = parts[1].split(';').map(function (op) { return op.split('='); });
                var parsedOptions_1 = {
                    start: dtstart,
                };
                options.forEach(function (option) {
                    switch (option[0]) {
                        case 'FREQ':
                            parsedOptions_1.frequency = parseFrequency(option[1]);
                            break;
                        case 'UNTIL':
                            parsedOptions_1.until = parseUntil(option[1], dateAdapterConstructor, dtstart);
                            break;
                        case 'COUNT':
                            parsedOptions_1.count = parseCount(option[1]);
                            break;
                        case 'INTERVAL':
                            parsedOptions_1.interval = parseInterval(option[1]);
                            break;
                        case 'BYSECOND':
                            parsedOptions_1.bySecondOfMinute = parseBySecond(option[1]);
                            break;
                        case 'BYMINUTE':
                            parsedOptions_1.byMinuteOfHour = parseByMinute(option[1]);
                            break;
                        case 'BYHOUR':
                            parsedOptions_1.byHourOfDay = parseByHour(option[1]);
                            break;
                        case 'BYDAY':
                            parsedOptions_1.byDayOfWeek = parseByDay(option[1]);
                            break;
                        case 'BYMONTHDAY':
                            parsedOptions_1.byDayOfMonth = parseByMonthDay(option[1]);
                            break;
                        case 'BYYEARDAY':
                            throw new ICalStringParseError("\"BYYEARDAY\" " + UNIMPLEMENTED_RULE_OPTION);
                        case 'BYWEEKNO':
                            throw new ICalStringParseError("\"BYWEEKNO\" " + UNIMPLEMENTED_RULE_OPTION);
                        case 'BYMONTH':
                            parsedOptions_1.byMonthOfYear = parseByMonth(option[1]);
                            break;
                        case 'BYSETPOS':
                            throw new ICalStringParseError("\"BYSETPOS\" " + UNIMPLEMENTED_RULE_OPTION);
                        case 'WKST':
                            parsedOptions_1.weekStart = parseWkst(option[1]);
                            break;
                        default:
                            throw new ICalStringParseError("Unknown ICAL rule \"" + option[0] + "\"");
                    }
                });
                rrules.push(parsedOptions_1);
            }
            else if (name === 'RDATE') {
                var time = dateAdapterConstructor.fromTimeObject(parseDatetime(parts[1]));
                rdates.push.apply(rdates, __spread(time));
            }
            else if (name === 'EXDATE') {
                var time = dateAdapterConstructor.fromTimeObject(parseDatetime(parts[1]));
                exdates.push.apply(exdates, __spread(time));
            }
            else {
                throw new ICalStringParseError("Unsupported ICAL part \"" + name + "\"");
            }
        });
    });
    return {
        rdates: rdates,
        exdates: exdates,
        rrules: rrules,
    };
}
exports.parseICalStrings = parseICalStrings;
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
function parseDTStart(text) {
    var parts = text && text.substring(0, 7);
    try {
        if (parts !== 'DTSTART')
            throw '';
        var timeObj = parseDatetime(text.substring(8));
        if (timeObj.datetimes.length !== 1)
            throw '';
        return timeObj;
    }
    catch (e) {
        throw new ICalStringParseError("Invalid \"DTSTART\" value \"" + text + "\"");
    }
}
exports.parseDTStart = parseDTStart;
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
function parseDatetime(text) {
    var parts = text.split(':');
    var unparsedTime;
    var datetimes;
    var timezone;
    try {
        if (parts.length === 1) {
            // no TZID / value part
            timezone = parts[0].search('Z') !== -1 ? 'UTC' : undefined;
            unparsedTime = parts[0].split('Z')[0];
        }
        else {
            // has TZID part
            var timeLabel = parts[0].split('=');
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
        datetimes = unparsedTime.split(',').map(function (time) {
            var newTime = time.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
            newTime && newTime.shift();
            if (newTime)
                return newTime.map(function (str) { return parseInt(str); });
            else
                throw '';
        });
    }
    catch (e) {
        throw new ICalStringParseError("Invalid ICAL date/time string \"" + text + "\"");
    }
    return { datetimes: datetimes, timezone: timezone, raw: text };
}
exports.parseDatetime = parseDatetime;
function parseFrequency(text) {
    if (!['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(text))
        throw new ICalStringParseError("Invalid FREQ value \"" + text + "\"");
    else {
        return text;
    }
}
exports.parseFrequency = parseFrequency;
// Here we say that the type `T` must be a constructor that returns a DateAdapter
// complient type
function parseUntil(text, dateAdapterConstructor, start) {
    var parsedDatetime = parseDatetime(text);
    if (parsedDatetime.datetimes.length !== 1)
        throw new ICalStringParseError("Invalid UNTIL value \"" + text + "\"");
    var date = dateAdapterConstructor.fromTimeObject(parsedDatetime)[0];
    date.set('timezone', start.get('timezone'));
    return date;
}
exports.parseUntil = parseUntil;
function parseCount(text) {
    var int = parseInt(text);
    if (typeof int !== 'number' || isNaN(int))
        throw new ICalStringParseError("Invalid COUNT value \"" + text + "\"");
    return int;
}
exports.parseCount = parseCount;
function parseInterval(text) {
    var int = parseInt(text);
    if (typeof int !== 'number' || isNaN(int))
        throw new ICalStringParseError("Invalid INTERVAL value \"" + text + "\"");
    return int;
}
exports.parseInterval = parseInterval;
function parseBySecond(text) {
    return text.split(',').map(function (text) {
        var int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError("Invalid BYSECOND value \"" + text + "\"");
        return int;
    });
}
exports.parseBySecond = parseBySecond;
function parseByMinute(text) {
    return text.split(',').map(function (text) {
        var int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError("Invalid BYMINUTE value \"" + text + "\"");
        return int;
    });
}
exports.parseByMinute = parseByMinute;
function parseByHour(text) {
    return text.split(',').map(function (text) {
        var int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError("Invalid BYHOUR value \"" + text + "\"");
        return int;
    });
}
exports.parseByHour = parseByHour;
function parseByDay(text) {
    return text.split(',').map(function (text) {
        text = text.trim();
        if (text.length > 2 && text.length < 5) {
            var number = void 0;
            var weekday = void 0;
            if (text[0] === '-') {
                number = parseInt(text.slice(0, 2));
                weekday = text.slice(2);
            }
            else {
                number = parseInt(text[0]);
                weekday = text.slice(1);
            }
            if (!utilities_1.Utils.weekdays.includes(weekday)) {
                throw new ICalStringParseError("Invalid BYDAY value \"" + text + "\"");
            }
            return [weekday, number];
        }
        else if (!utilities_1.Utils.weekdays.includes(text)) {
            throw new ICalStringParseError("Invalid BYDAY value \"" + text + "\"");
        }
        else {
            return text;
        }
    });
}
exports.parseByDay = parseByDay;
function parseByMonthDay(text) {
    return text.split(',').map(function (text) {
        var int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError("Invalid BYMONTHDAY value \"" + text + "\"");
        return int;
    });
}
exports.parseByMonthDay = parseByMonthDay;
function parseByMonth(text) {
    return text.split(',').map(function (text) {
        var int = parseInt(text);
        if (typeof int !== 'number' || isNaN(int))
            throw new ICalStringParseError("Invalid BYMONTH value \"" + text + "\"");
        return int;
    });
}
exports.parseByMonth = parseByMonth;
function parseWkst(text) {
    if (!utilities_1.Utils.weekdays.includes(text)) {
        throw new ICalStringParseError("Invalid WKST value \"" + text + "\"");
    }
    return text;
}
exports.parseWkst = parseWkst;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9pY2FsL3BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLDBDQUFvQztBQUVwQztJQUEwQyx3Q0FBSztJQUEvQzs7SUFBaUQsQ0FBQztJQUFELDJCQUFDO0FBQUQsQ0FBQyxBQUFsRCxDQUEwQyxLQUFLLEdBQUc7QUFBckMsb0RBQW9CO0FBRWpDLElBQU0seUJBQXlCLEdBQzdCLDBDQUEwQztJQUMxQyx3RUFBd0UsQ0FBQTtBQUUxRTs7Ozs7Ozs7OztHQVVHO0FBRUgsMEJBSUUsV0FBcUIsRUFDckIsc0JBQWtEO0lBTWxELElBQU0sTUFBTSxHQUFpQyxFQUFFLENBQUE7SUFDL0MsSUFBTSxNQUFNLEdBQVEsRUFBRSxDQUFBO0lBQ3RCLElBQU0sT0FBTyxHQUFRLEVBQUUsQ0FBQTtJQUV2QixXQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtRQUN0QixJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzlCLElBQU0sT0FBTyxHQUFHLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUVyRixLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtZQUNoQixJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzdCLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUVyQixJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7Z0JBQ3BCLElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEs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