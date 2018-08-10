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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var interfaces_1 = require("./interfaces");
var date_fns_1 = require("date-fns");
var lodash_uniq_1 = __importDefault(require("lodash.uniq"));
var utilities_1 = require("../utilities");
var ByDayOfMonthPipe = /** @class */ (function (_super) {
    __extends(ByDayOfMonthPipe, _super);
    function ByDayOfMonthPipe() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.upcomingMonthDays = [];
        _this.upcomingDays = [];
        return _this;
    }
    ByDayOfMonthPipe.prototype.run = function (args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (this.options.frequency === 'YEARLY' && this.options.byMonthOfYear === undefined) {
            return this.yearlyExpand(args);
        }
        else if (['YEARLY', 'MONTHLY'].includes(this.options.frequency)) {
            return this.expand(args);
        }
        else
            return this.filter(args);
    };
    ByDayOfMonthPipe.prototype.yearlyExpand = function (args) {
        var date = args.date;
        if (this.upcomingMonthDays.length === 0) {
            this.upcomingMonthDays = getUpcomingMonthDays(date, this.options);
            if (this.upcomingMonthDays.length === 0) {
                var next = utilities_1.Utils.setDateToStartOfYear(date.clone().add(1, 'year'));
                return this.nextPipe.run({ invalidDate: true, date: date, skipToIntervalOnOrAfter: next });
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
        var nextDay = this.upcomingMonthDays.shift();
        date.set('month', nextDay[0]).set('day', nextDay[1]);
        if (this.upcomingMonthDays.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date: date });
    };
    ByDayOfMonthPipe.prototype.expand = function (args) {
        var date = args.date;
        if (this.upcomingDays.length === 0) {
            this.upcomingDays = getUpcomingDays(date, this.options);
            if (this.upcomingDays.length === 0) {
                var next = date
                    .clone()
                    .add(1, 'month')
                    .set('day', 1);
                return this.nextPipe.run({ invalidDate: true, date: date, skipToIntervalOnOrAfter: next });
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
    ByDayOfMonthPipe.prototype.filter = function (args) {
        var e_1, _a;
        var upcomingDays = getUpcomingDays(args.date, this.options);
        var validDay = false;
        var nextValidDayThisMonth = null;
        try {
            for (var upcomingDays_1 = __values(upcomingDays), upcomingDays_1_1 = upcomingDays_1.next(); !upcomingDays_1_1.done; upcomingDays_1_1 = upcomingDays_1.next()) {
                var day = upcomingDays_1_1.value;
                if (args.date.get('day') === day) {
                    validDay = true;
                    break;
                }
                else if (args.date.get('day') < day) {
                    nextValidDayThisMonth = day;
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (upcomingDays_1_1 && !upcomingDays_1_1.done && (_a = upcomingDays_1.return)) _a.call(upcomingDays_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (validDay)
            return this.nextPipe.run({ date: args.date });
        var next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the month?
        //
        // Note:
        // We know the current `options.frequency` is not yearly or monthly or weekly
        if (nextValidDayThisMonth !== null) {
            // if yes, advance the current date forward to the next month which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'day');
            next.add(nextValidDayThisMonth - args.date.get('day'), 'day');
        }
        else {
            // if no, advance the current date forward one year &
            // and set the date to whatever month would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'month');
            next.add(1, 'month');
            var nextDay = getUpcomingDays(next, this.options)[0];
            next.set('day', nextDay);
        }
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    };
    return ByDayOfMonthPipe;
}(interfaces_1.PipeRule));
exports.ByDayOfMonthPipe = ByDayOfMonthPipe;
function getUpcomingMonthDays(date, options) {
    var next = date.clone();
    var monthDays = [];
    for (var i = next.get('month'); i <= 12; i++) {
        var days = getUpcomingDays(next, options);
        monthDays.push.apply(monthDays, __spread(days.map(function (day) { return [next.get('month'), day]; })));
        next.add(1, 'month').set('day', 1);
        i++;
    }
    return monthDays;
}
function getUpcomingDays(date, options) {
    var daysInMonth = getDaysInMonth(date.get('month'), date.get('year'));
    return lodash_uniq_1.default(options
        .byDayOfMonth.filter(function (day) {
        return daysInMonth >= Math.abs(day);
    })
        .map(function (day) { return (day > 0 ? day : daysInMonth + day + 1); })
        .sort(function (a, b) {
        if (a > b)
            return 1;
        if (a < b)
            return -1;
        else
            return 0;
    })).filter(function (day) { return date.get('day') <= day; });
}
function getDaysInMonth(month, year) {
    var block = {
        1: 31,
        2: getDaysInFebruary(year),
        3: 31,
        4: 30,
        5: 31,
        6: 30,
        7: 31,
        8: 31,
        9: 30,
        10: 31,
        11: 30,
        12: 31,
    };
    return block[month];
}
function getDaysInFebruary(year) {
    return date_fns_1.isLeapYear(new Date(year, 0, 1)) ? 29 : 28;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDUtYnktZGF5LW9mLW1vbnRoLnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3BpcGVzLzA1LWJ5LWRheS1vZi1tb250aC5waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLDJDQUE4RDtBQUM5RCxxQ0FBcUM7QUFDckMsNERBQThCO0FBQzlCLDBDQUFvQztBQUVwQztJQUFnRSxvQ0FBVztJQUEzRTtRQUFBLHFFQW9IQztRQXhHUyx1QkFBaUIsR0FBdUIsRUFBRSxDQUFBO1FBNEIxQyxrQkFBWSxHQUFhLEVBQUUsQ0FBQTs7SUE0RXJDLENBQUM7SUFsSEMsOEJBQUcsR0FBSCxVQUFJLElBQW1CO1FBQ3JCLElBQUksSUFBSSxDQUFDLFdBQVc7WUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRXBELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxLQUFLLFNBQVMsRUFBRTtZQUNuRixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDL0I7YUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ2pFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUN6Qjs7WUFBTSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDakMsQ0FBQztJQUdELHVDQUFZLEdBQVosVUFBYSxJQUFtQjtRQUM5QixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1FBRXRCLElBQUksSUFBSSxDQUFDLGlCQUFpQixD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