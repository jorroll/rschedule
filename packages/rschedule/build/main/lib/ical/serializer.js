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
Object.defineProperty(exports, "__esModule", { value: true });
var utilities_1 = require("../utilities");
var rule_options_1 = require("../rule/rule-options");
var ICalStringSerialzeError = /** @class */ (function (_super) {
    __extends(ICalStringSerialzeError, _super);
    function ICalStringSerialzeError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ICalStringSerialzeError;
}(Error));
exports.ICalStringSerialzeError = ICalStringSerialzeError;
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
function ruleOptionsToIcalString(options, type) {
    if (type === void 0) { type = 'RRULE'; }
    // First validate options object, but don't use the result
    rule_options_1.buildValidatedRuleOptions(options);
    var icalString;
    var start = options.start;
    icalString = "DTSTART:" + start.toICal() + "\n" + type + ":";
    var stringOptions = [];
    for (var option in options) {
        if (options.hasOwnProperty(option)) {
            switch (option) {
                case 'frequency':
                    stringOptions.push("FREQ=" + options.frequency);
                    break;
                case 'interval':
                    stringOptions.push("INTERVAL=" + options.interval);
                    break;
                case 'until':
                    stringOptions.push("UNTIL=" + options.until.toICal(!!start.get('timezone')));
                    break;
                case 'count':
                    stringOptions.push("COUNT=" + options.count);
                    break;
                case 'bySecondOfMinute':
                    stringOptions.push("BYSECOND=" + options.bySecondOfMinute.join(','));
                    break;
                case 'byMinuteOfHour':
                    stringOptions.push("BYMINUTE=" + options.byMinuteOfHour.join(','));
                    break;
                case 'byHourOfDay':
                    stringOptions.push("BYHOUR=" + options.byHourOfDay.join(','));
                    break;
                case 'byDayOfWeek':
                    stringOptions.push("BYDAY=" + serializeByDayOfWeek(options.byDayOfWeek));
                    break;
                case 'byDayOfMonth':
                    stringOptions.push("BYMONTHDAY=" + options.byDayOfMonth.join(','));
                    break;
                case 'byMonthOfYear':
                    stringOptions.push("BYMONTH=" + options.byMonthOfYear.join(','));
                    break;
                case 'weekStart':
                    stringOptions.push("WKST=" + options.weekStart);
                    break;
            }
        }
    }
    return icalString.concat(stringOptions.join(';'));
}
exports.ruleOptionsToIcalString = ruleOptionsToIcalString;
function serializeByDayOfWeek(args) {
    return args.map(function (arg) { return (Array.isArray(arg) ? "" + arg[1] + arg[0] : arg); }).join(',');
}
/**
 * Converts an array of dates into an ICAL string containing RDATEs.
 * All dates must be in the same timezone.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
function datesToIcalString(dates, type) {
    if (type === void 0) { type = 'RDATE'; }
    if (dates.length === 0)
        throw new ICalStringSerialzeError('`datesToIcalString()` must recieve at least one date');
    var icalString;
    dates.sort(function (a, b) {
        if (a.isAfter(b))
            return 1;
        else if (b.isAfter(a))
            return -1;
        else
            return 0;
    });
    var start = dates[0];
    var seperator = [undefined, 'UTC'].includes(start.get('timezone')) ? ':' : ';';
    icalString = "DTSTART:" + start.toICal() + "\n" + type + seperator;
    return icalString.concat(dates.map(function (date) { return date.toICal(); }).join(','));
}
exports.datesToIcalString = datesToIcalString;
function dateAdapterToICal(date, utc) {
    var timezone = utc ? 'UTC' : date.get('timezone');
    switch (timezone) {
        case undefined:
            return "" + utilities_1.Utils.dateToStandardizedString(date);
        case 'UTC':
            return utilities_1.Utils.dateToStandardizedString(date) + "Z";
        default:
            return "TZID=" + date.get('timezone') + ":" + utilities_1.Utils.dateToStandardizedString(date);
    }
}
exports.dateAdapterToICal = dateAdapterToICal;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvaWNhbC9zZXJpYWxpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLDBDQUFvQztBQUVwQyxxREFBeUU7QUFFekU7SUFBNkMsMkNBQUs7SUFBbEQ7O0lBQW9ELENBQUM7SUFBRCw4QkFBQztBQUFELENBQUMsQUFBckQsQ0FBNkMsS0FBSyxHQUFHO0FBQXhDLDBEQUF1QjtBQUVwQzs7Ozs7Ozs7OztHQVVHO0FBQ0gsaUNBQ0UsT0FBbUMsRUFDbkMsSUFBa0M7SUFBbEMscUJBQUEsRUFBQSxjQUFrQztJQUVsQywwREFBMEQ7SUFDMUQsd0NBQXlCLENBQUMsT0FBTyxDQUFDLENBQUE7SUFFbEMsSUFBSSxVQUFrQixDQUFBO0lBRXRCLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUE7SUFFM0IsVUFBVSxHQUFHLGFBQVcsS0FBSyxDQUFDLE1BQU0sRUFBRSxVQUFLLElBQUksTUFBRyxDQUFBO0lBRWxELElBQU0sYUFBYSxHQUFhLEVBQUUsQ0FBQTtJQUVsQyxLQUFLLElBQU0sTUFBTSxJQUFJLE9BQU8sRUFBRTtRQUM1QixJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDbEMsUUFBUSxNQUFNLEVBQUU7Z0JBQ2QsS0FBSyxXQUFXO29CQUNkLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBUSxPQUFPLENBQUMsU0FBVyxDQUFDLENBQUE7b0JBQy9DLE1BQUs7Z0JBQ1AsS0FBSyxVQUFVO29CQUNiLGFBQWEsQ0FBQyxJQUFJLENBQUMsY0FBWSxPQUFPLENBQUMsUUFBVSxDQUFDLENBQUE7b0JBQ2xELE1BQUs7Z0JBQ1AsS0FBSyxPQUFPO29CQUNWLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBUyxPQUFPLENBQUMsS0FBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdB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