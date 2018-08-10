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
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This function performs validation checks on the provided rule options and retuns
 * a cloned validated options object.
 */
function buildValidatedRuleOptions(options) {
    var start = options.start;
    if (options.interval !== undefined && options.interval < 1) {
        throw new RuleValidationError('"interval" cannot be less than 1');
    }
    if (options.bySecondOfMinute !== undefined &&
        options.bySecondOfMinute.some(function (num) { return num < 0 || num > 60; })) {
        throw new RuleValidationError('"bySecondOfMinute" values must be >= 0 && <= 60');
    }
    if (options.byMinuteOfHour !== undefined &&
        options.byMinuteOfHour.some(function (num) { return num < 0 || num > 59; })) {
        throw new RuleValidationError('"byMinuteOfHour" values must be >= 0 && <= 59');
    }
    if (options.byHourOfDay !== undefined && options.byHourOfDay.some(function (num) { return num < 0 || num > 23; })) {
        throw new RuleValidationError('"byHourOfDay" values must be >= 0 && <= 23');
    }
    if (!['YEARLY', 'MONTHLY'].includes(options.frequency) &&
        options.byDayOfWeek !== undefined &&
        options.byDayOfWeek.some(function (weekday) { return Array.isArray(weekday); })) {
        throw new RuleValidationError('"byDayOfWeek" can only include a numeric value when the "frequency" is ' +
            'either "MONTHLY" or "YEARLY"');
    }
    if (options.frequency === 'MONTHLY' &&
        options.byDayOfWeek !== undefined &&
        options.byDayOfWeek.some(function (weekday) { return Array.isArray(weekday) && (weekday[1] < -31 || weekday[1] === 0 || weekday[1] > 31); })) {
        throw new RuleValidationError('when "frequency" is "MONTHLY", each "byDayOfWeek" can optionally only' +
            ' have a numeric value >= -31 and <= 31 and !== 0');
    }
    if (options.frequency === 'YEARLY' &&
        options.byDayOfWeek !== undefined &&
        options.byDayOfWeek.some(function (weekday) {
            return Array.isArray(weekday) && (weekday[1] < -366 || weekday[1] === 0 || weekday[1] > 366);
        })) {
        throw new RuleValidationError('when "frequency" is "YEARLY", each "byDayOfWeek" can optionally only' +
            ' have a numeric value >= -366 and <= 366 and !== 0');
    }
    if (options.frequency === 'WEEKLY' && options.byDayOfMonth !== undefined) {
        throw new RuleValidationError('when "frequency" is "WEEKLY", "byDayOfMonth" cannot be present');
    }
    if (options.until !== undefined && options.count !== undefined) {
        throw new RuleValidationError('"until" and "count" cannot both be present');
    }
    if (options.until !== undefined && !options.until.isSameClass(start)) {
        throw new RuleValidationError('"until" and "start" must both be of the same class');
    }
    if (options.byMonthOfYear) {
        options.byMonthOfYear.sort(function (a, b) {
            if (a > b)
                return 1;
            else if (b > a)
                return -1;
            else
                return 0;
        });
    }
    if (options.byHourOfDay) {
        options.byHourOfDay.sort(function (a, b) {
            if (a > b)
                return 1;
            else if (b > a)
                return -1;
            else
                return 0;
        });
    }
    if (options.byMinuteOfHour) {
        options.byMinuteOfHour.sort(function (a, b) {
            if (a > b)
                return 1;
            else if (b > a)
                return -1;
            else
                return 0;
        });
    }
    if (options.bySecondOfMinute) {
        options.bySecondOfMinute.sort(function (a, b) {
            if (a > b)
                return 1;
            else if (b > a)
                return -1;
            else
                return 0;
        });
    }
    var defaultOptions = {
        start: options.start,
        frequency: options.frequency,
        interval: 1,
        weekStart: 'MO',
    };
    if (!(options.byDayOfMonth || options.byDayOfWeek)) {
        switch (options.frequency) {
            case 'YEARLY':
                defaultOptions.byMonthOfYear = [options.start.get('month')];
            case 'MONTHLY':
                defaultOptions.byDayOfMonth = [options.start.get('day')];
                break;
            case 'WEEKLY':
                defaultOptions.byDayOfWeek = [options.start.get('weekday')];
                break;
        }
    }
    switch (options.frequency) {
        case 'YEARLY':
        case 'MONTHLY':
        case 'WEEKLY':
        case 'DAILY':
            defaultOptions.byHourOfDay = [options.start.get('hour')];
        case 'HOURLY':
            defaultOptions.byMinuteOfHour = [options.start.get('minute')];
        case 'MINUTELY':
            defaultOptions.bySecondOfMinute = [options.start.get('second')];
    }
    return __assign({}, defaultOptions, options, { start: options.start.clone() });
}
exports.buildValidatedRuleOptions = buildValidatedRuleOptions;
var RuleValidationError = /** @class */ (function (_super) {
    __extends(RuleValidationError, _super);
    function RuleValidationError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return RuleValidationError;
}(Error));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZS1vcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9ydWxlL3J1bGUtb3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBOzs7R0FHRztBQUNILG1DQUNFLE9BQW1DO0lBRW5DLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUE7SUFFM0IsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRTtRQUMxRCxNQUFNLElBQUksbUJBQW1CLENBQUMsa0NBQWtDLENBQUMsQ0FBQTtLQUNsRTtJQUNELElBQ0UsT0FBTyxDQUFDLGdCQUFnQixLQUFLLFNBQVM7UUFDdEMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFBLEdBQUcsSUFBSSxPQUFBLEdBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsRUFBbkIsQ0FBbUIsQ0FBQyxFQUN6RDtRQUNBLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxpREFBaUQsQ0FBQyxDQUFBO0tBQ2pGO0lBQ0QsSUFDRSxPQUFPLENBQUMsY0FBYyxLQUFLLFNBQVM7UUFDcEMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLEVBQW5CLENBQW1CLENBQUMsRUFDdkQ7UUFDQSxNQUFNLElBQUksbUJBQW1CLENBQUMsK0NBQStDLENBQUMsQ0FBQTtLQUMvRTtJQUNELElBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxTQUFTLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHLElBQUksT0FBQSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLEVBQW5CLENBQW1CLENBQUMsRUFBRTtRQUM3RixN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