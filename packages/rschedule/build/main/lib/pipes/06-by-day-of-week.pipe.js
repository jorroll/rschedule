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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var interfaces_1 = require("./interfaces");
var utilities_1 = require("../utilities");
var lodash_sorteduniq_1 = __importDefault(require("lodash.sorteduniq"));
var ByDayOfWeekPipe = /** @class */ (function (_super) {
    __extends(ByDayOfWeekPipe, _super);
    function ByDayOfWeekPipe() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        // used to speed up some operations below;
        _this.cachedValidMonthDays = ['', []];
        _this.cachedValidYearDays = [0, []];
        // for `monthlyExpand()` and `weeklyExpand()`, upcomingDays
        // holds an array of dates within the current month that are valid
        //
        // for `yearlyExpand()`, upcomingDays holds an array of numbers,
        // each number is equal to the number of days from the start of
        // the year that a valid date exists on. i.e. set a
        // date to January 1st and then add days to the date equal to
        // one of the numbers in the array and you'll be on a valid date.
        _this.upcomingDays = [];
        return _this;
    }
    ByDayOfWeekPipe.prototype.run = function (args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (this.options.frequency === 'MONTHLY') {
            return this.options.byDayOfMonth !== undefined
                ? this.monthlyFilter(args)
                : this.monthlyExpand(args);
        }
        else if (this.options.frequency === 'YEARLY') {
            if (this.options.byMonthOfYear !== undefined && this.options.byDayOfMonth !== undefined)
                return this.monthlyFilter(args);
            else if (this.options.byMonthOfYear !== undefined)
                return this.monthlyExpand(args);
            else if (this.options.byDayOfMonth !== undefined) {
                return this.yearlyFilter(args);
            }
            else
                return this.yearlyExpand(args);
        }
        else {
            return this.options.frequency === 'WEEKLY' ? this.weeklyExpand(args) : this.simpleFilter(args);
        }
    };
    ByDayOfWeekPipe.prototype.yearlyExpand = function (args) {
        var date = args.date;
        if (this.upcomingDays.length === 0) {
            if (this.cachedValidYearDays[0] !== date.get('year')) {
                this.cachedValidYearDays = [date.get('year'), getValidYearDays(date, this.options)];
            }
            this.upcomingDays = this.cachedValidYearDays[1];
            if (this.upcomingDays.length === 0) {
                return this.nextPipe.run({ date: date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byHourOfDay)
                date.set('hour', 0);
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        var nextDay = this.upcomingDays.shift();
        utilities_1.Utils.setDateToStartOfYear(date).add(nextDay - 1, 'day');
        if (this.upcomingDays.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date: date });
    };
    ByDayOfWeekPipe.prototype.monthlyExpand = function (args) {
        var date = args.date;
        if (this.upcomingDays.length === 0) {
            if (this.cachedValidMonthDays[0] !== date.get('year') + "-" + date.get('month')) {
                this.cachedValidMonthDays = [
                    date.get('year') + "-" + date.get('month'),
                    getValidMonthDays(date, this.options),
                ];
            }
            this.upcomingDays = this.cachedValidMonthDays[1];
            if (this.upcomingDays.length === 0) {
                return this.nextPipe.run({ date: date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byHourOfDay)
                date.set('hour', 0);
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        var nextDay = this.upcomingDays.shift();
        date.set('day', nextDay);
        if (this.upcomingDays.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date: date });
    };
    ByDayOfWeekPipe.prototype.weeklyExpand = function (args) {
        var date = args.date;
        if (this.upcomingDays.length === 0) {
            var orderedWeekdays_1 = utilities_1.Utils.orderedWeekdays(this.options.weekStart);
            var currentDateIndex_1 = orderedWeekdays_1.indexOf(date.get('weekday'));
            this.upcomingDays = this.options
                .byDayOfWeek // calculate the number of days that need to be added to the current date to
                // get to a valid date
                .map(function (day) { return orderedWeekdays_1.indexOf(day); })
                .filter(function (day) { return day >= currentDateIndex_1; })
                .sort(function (a, b) {
                if (a > b)
                    return 1;
                if (b > a)
                    return -1;
                return 0;
            });
            if (this.upcomingDays.length === 0) {
                return this.nextPipe.run({ date: date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byHourOfDay)
                date.set('hour', 0);
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        var nextDay = this.upcomingDays.shift();
        utilities_1.Utils.setDateToStartOfWeek(date, this.options.weekStart).add(nextDay, 'day');
        if (this.upcomingDays.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date: date });
    };
    ByDayOfWeekPipe.prototype.yearlyFilter = function (args) {
        var nextValidDateThisYear = getNextValidDateThisYear(args.date, this.options, this.cachedValidYearDays);
        var validDay = nextValidDateThisYear
            ? args.date.get('day') === nextValidDateThisYear.get('day')
            : false;
        if (validDay)
            return this.nextPipe.run({ date: args.date });
        var newDate = this.cloneDateWithGranularity(args.date, 'year').add(1, 'year');
        var next = nextValidDateThisYear
            ? nextValidDateThisYear
            : getNextValidDateThisYear(newDate, this.options, this.cachedValidYearDays);
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    };
    ByDayOfWeekPipe.prototype.monthlyFilter = function (args) {
        var nextValidDateThisMonth = getNextValidDateThisMonth(this.cloneDateWithGranularity(args.date, 'day'), this.options, this.cachedValidMonthDays);
        var validDay = nextValidDateThisMonth
            ? args.date.get('day') === nextValidDateThisMonth.get('day')
            : false;
        if (validDay)
            return this.nextPipe.run({ date: args.date });
        var next = nextValidDateThisMonth
            ? nextValidDateThisMonth
            : getNextValidDateThisMonth(this.cloneDateWithGranularity(args.date, 'month').add(1, 'month'), this.options, this.cachedValidMonthDays);
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    };
    ByDayOfWeekPipe.prototype.simpleFilter = function (args) {
        var _this = this;
        var validWeekdays = utilities_1.Utils.orderedWeekdays(this.options.weekStart).filter(function (day) {
            return _this.options.byDayOfWeek.includes(day);
        });
        var validDay = validWeekdays.includes(args.date.get('weekday'));
        if (validDay)
            return this.nextPipe.run({ date: args.date });
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the week?
        //
        // - We know the current `options.frequency` is not yearly or monthly or weekly
        var upcomingWeekdays = utilities_1.Utils.weekdays.slice(utilities_1.Utils.weekdays.indexOf(args.date.get('weekday')));
        var validUpcomingWeekday = validWeekdays.filter(function (day) { return upcomingWeekdays.includes(day); })[0];
        var weekday = validUpcomingWeekday ? validUpcomingWeekday : validWeekdays[0];
        var next = this.cloneDateWithGranularity(args.date, 'day');
        var days = differenceInDaysBetweenTwoWeekdays(args.date.get('weekday'), weekday);
        next.add(days, 'day');
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    };
    return ByDayOfWeekPipe;
}(interfaces_1.PipeRule));
exports.ByDayOfWeekPipe = ByDayOfWeekPipe;
function differenceInDaysBetweenTwoWeekdays(a, b) {
    var result = utilities_1.Utils.weekdays.indexOf(a) - utilities_1.Utils.weekdays.indexOf(b);
    return result > 0 ? 7 - result : Math.abs(result);
}
function getNextValidDateThisYear(date, options, validYearDaysCache) {
    if (validYearDaysCache[0] !== date.get('year')) {
        validYearDaysCache = [date.get('year'), getValidYearDays(date, options)];
    }
    date = date
        .clone()
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0);
    var currentYearDay = date.get('yearday');
    var dayNumber = validYearDaysCache[1].find(function (dayNumber) { return dayNumber >= currentYearDay; });
    if (dayNumber)
        return utilities_1.Utils.setDateToStartOfYear(date).add(dayNumber - 1, 'day');
    else
        return null;
}
function getValidYearDays(date, options) {
    var e_1, _a, e_2, _b;
    var weekdays = [];
    var specificWeekdays = [];
    var hasPositiveWeekdays = false;
    var hasNegativeWeekdays = false;
    var validDates = [];
    options.byDayOfWeek.forEach(function (day) {
        if (!Array.isArray(day))
            weekdays.push(day);
        else {
            specificWeekdays.push(day);
            day[1] > 0 ? (hasPositiveWeekdays = true) : (hasNegativeWeekdays = true);
        }
    });
    var firstWeekdays = {};
    var lastWeekdays = {};
    var lastDayOfYear = utilities_1.Utils.getDaysInYear(date.get('year'));
    if (hasPositiveWeekdays || weekdays.length > 0) {
        var startingDate = utilities_1.Utils.setDateToStartOfYear(date.clone());
        firstWeekdays[startingDate.get('weekday')] = 1;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 2;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 3;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 4;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 5;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 6;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 7;
    }
    if (hasNegativeWeekdays) {
        var endingDate = utilities_1.Utils.setDateToEndOfYear(date.clone());
        lastWeekdays[endingDate.get('weekday')] = lastDayOfYear;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = lastDayOfYear - 1;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = lastDayOfYear - 2;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = lastDayOfYear - 3;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = lastDayOfYear - 4;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = lastDayOfYear - 5;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = lastDayOfYear - 6;
    }
    try {
        for (var specificWeekdays_1 = __values(specificWeekdays), specificWeekdays_1_1 = specificWeekdays_1.next(); !specificWeekdays_1_1.done; specificWeekdays_1_1 = specificWeekdays_1.next()) {
            var weekday = specificWeekdays_1_1.value;
            var nextYearDay = void 0;
            if (weekday[1] < 0) {
                nextYearDay = lastWeekdays[weekday[0]] + (weekday[1] + 1) * 7;
            }
            else {
                nextYearDay = firstWeekdays[weekday[0]] + (weekday[1] - 1) * 7;
            }
            if (nextYearDay > lastDayOfYear || nextYearDay < 0) {
                continue;
            }
            validDates.push(nextYearDay);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (specificWeekdays_1_1 && !specificWeekdays_1_1.done && (_a = specificWeekdays_1.return)) _a.call(specificWeekdays_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    try {
        for (var weekdays_1 = __values(weekdays), weekdays_1_1 = weekdays_1.next(); !weekdays_1_1.done; weekdays_1_1 = weekdays_1.next()) {
            var weekday = weekdays_1_1.value;
            var nextYearDay = firstWeekdays[weekday];
            while (nextYearDay <= lastDayOfYear) {
                validDates.push(nextYearDay);
                nextYearDay = nextYearDay + 7;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (weekdays_1_1 && !weekdays_1_1.done && (_b = weekdays_1.return)) _b.call(weekdays_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return lodash_sorteduniq_1.default(validDates
        .sort(function (a, b) {
        if (a > b)
            return 1;
        else if (b > a)
            return -1;
        else
            return 0;
    })
        .filter(function (yearday) { return date.get('yearday') <= yearday; }));
}
function getNextValidDateThisMonth(date, options, validMonthDaysCache) {
    if (validMonthDaysCache[0] !== date.get('year') + "-" + date.get('month')) {
        validMonthDaysCache = [
            date.get('year') + "-" + date.get('month'),
            getValidMonthDays(date, options),
        ];
    }
    date = date
        .clone()
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0);
    var currentDay = date.get('day');
    var day = validMonthDaysCache[1].find(function (day) { return day >= currentDay; });
    if (day)
        return date.set('day', day);
    else
        return null;
}
function getValidMonthDays(date, options) {
    var e_3, _a, e_4, _b;
    var weekdays = [];
    var specificWeekdays = [];
    var hasPositiveWeekdays = false;
    var hasNegativeWeekdays = false;
    var validDates = [];
    options.byDayOfWeek.forEach(function (day) {
        if (!Array.isArray(day))
            weekdays.push(day);
        else {
            specificWeekdays.push(day);
            day[1] > 0 ? (hasPositiveWeekdays = true) : (hasNegativeWeekdays = true);
        }
    });
    var firstWeekdays = {};
    var lastWeekdays = {};
    var daysInMonth = utilities_1.Utils.getDaysInMonth(date.get('month'), date.get('year'));
    if (hasPositiveWeekdays || weekdays.length > 0) {
        var startingDate = date.clone().set('day', 1);
        firstWeekdays[startingDate.get('weekday')] = 1;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 2;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 3;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 4;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 5;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 6;
        firstWeekdays[startingDate.add(1, 'day').get('weekday')] = 7;
    }
    if (hasNegativeWeekdays) {
        var endingDate = date.clone().set('day', daysInMonth);
        lastWeekdays[endingDate.get('weekday')] = daysInMonth;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 1;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 2;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 3;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 4;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 5;
        lastWeekdays[endingDate.subtract(1, 'day').get('weekday')] = daysInMonth - 6;
    }
    try {
        for (var specificWeekdays_2 = __values(specificWeekdays), specificWeekdays_2_1 = specificWeekdays_2.next(); !specificWeekdays_2_1.done; specificWeekdays_2_1 = specificWeekdays_2.next()) {
            var weekday = specificWeekdays_2_1.value;
            var nextDay = void 0;
            if (weekday[1] < 0) {
                nextDay = lastWeekdays[weekday[0]] + (weekday[1] + 1) * 7;
            }
            else {
                nextDay = firstWeekdays[weekday[0]] + (weekday[1] - 1) * 7;
            }
            if (nextDay > daysInMonth || nextDay < 0) {
                continue;
            }
            validDates.push(nextDay);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (specificWeekdays_2_1 && !specificWeekdays_2_1.done && (_a = specificWeekdays_2.return)) _a.call(specificWeekdays_2);
        }
        finally { if (e_3) throw e_3.error; }
    }
    try {
        for (var weekdays_2 = __values(weekdays), weekdays_2_1 = weekdays_2.next(); !weekdays_2_1.done; weekdays_2_1 = weekdays_2.next()) {
            var weekday = weekdays_2_1.value;
            var nextDay = firstWeekdays[weekday];
            while (nextDay <= daysInMonth) {
                validDates.push(nextDay);
                nextDay = nextDay + 7;
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (weekdays_2_1 && !weekdays_2_1.done && (_b = weekdays_2.return)) _b.call(weekdays_2);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return lodash_sorteduniq_1.default(validDates
        .sort(function (a, b) {
        if (a > b)
            return 1;
        else if (b > a)
            return -1;
        else
            return 0;
    })
        .filter(function (monthday) { return date.get('day') <= monthday; }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDYtYnktZGF5LW9mLXdlZWsucGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcGlwZXMvMDYtYnktZGF5LW9mLXdlZWsucGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQThEO0FBRTlELDBDQUFvQztBQUNwQyx3RUFBMEM7QUFFMUM7SUFBK0QsbUNBQVc7SUFBMUU7UUFBQSxxRUEyTkM7UUF2TUMsMENBQTBDO1FBQ2xDLDBCQUFvQixHQUF1QixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUNuRCx5QkFBbUIsR0FBdUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFekQsMkRBQTJEO1FBQzNELGtFQUFrRTtRQUNsRSxFQUFFO1FBQ0YsZ0VBQWdFO1FBQ2hFLCtEQUErRDtRQUMvRCxtREFBbUQ7UUFDbkQsNkRBQTZEO1FBQzdELGlFQUFpRTtRQUN6RCxrQkFBWSxHQUFhLEVBQUUsQ0FBQTs7SUEyTHJDLENBQUM7SUExTkMsNkJBQUcsR0FBSCxVQUFJLElBQW1CO1FBQ3JCLElBQUksSUFBSSxDQUFDLFdBQVc7WUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRXBELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQ3hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEtBQUssU0FBUztnQkFDNUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDO2dCQUMxQixDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUM3QjthQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFO1lBQzlDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFh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QUE7UUFDOUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUM1RCxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzVELGFBQWEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDNUQsYUFBYSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUM1RCxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzVELGFBQWEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDN0Q7SUFFRCxJQUFJLG1CQUFtQixFQUFFO1FBQ3ZCLElBQU0sVUFBVSxHQUFHLGlCQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUE7UUFFekQsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUE7UUFDdkQsWUFBWSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUE7UUFDOUUsWUFBWSxD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UyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDNUQsYUFBYSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUM1RCxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQzdEO0lBRUQsSUFBSSxtQkFBbUIsRUFBRTtRQUN2QixJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQTtRQUV2RCxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQTtRQUNyRCxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUM1RSxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUM1RSxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUM1RSxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUM1RSxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQTtRQUM1RSxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQTtLQUM3RTs7UUFFRCxLQUFzQixJQUFBLHFCQUFBLFNBQUEsZ0JBQWdCLENBQUEsa0RBQUEsZ0ZBQUU7WUFBbkMsSUFBTSxPQUFPLDZCQUFBO1lBQ2hCLElBQUksT0FBTyxTQUFRLENBQUE7WUFFbkIsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNsQixPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUMxRDtpQkFBTTtnQkFDTCxPQUFPLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUMzRDtZQUVELElBQUksT0FBTyxHQUFHLFdBQVcsSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFO2dCQUN4QyxTQUFRO2FBQ1Q7WUFFRCxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1NBQ3pCOzs7Ozs7Ozs7O1FBRUQsS0FBc0IsSUFBQSxhQUFBLFNBQUEsUUFBUSxDQUFBLGtDQUFBLHdEQUFFO1lBQTNCLElBQU0sT0FBTyxxQkFBQTtZQUNoQixJQUFJLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7WUFFcEMsT0FBTyxPQUFPLElBQUksV0FBVyxFQUFFO2dCQUM3QixVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUN4QixPQUFPLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQTthQUN0QjtTQUNGOzs7Ozs7Ozs7SUFFRCxPQUFPLDJCQUFVLENBQ2YsVUFBVTtTQUNQLElBQUksQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDO1FBQ1QsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUFFLE9BQU8sQ0FBQyxDQUFBO2FBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUE7O1lBQ3BCLE9BQU8sQ0FBQyxDQUFBO0lBQ2YsQ0FBQyxDQUFDO1NBQ0QsTUFBTSxDQUFDLFVBQUEsUUFBUSxJQUFJLE9BQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxRQUFRLEVBQTNCLENBQTJCLENBQUMsQ0FDbkQsQ0FBQTtBQUNILENBQUMifQ==