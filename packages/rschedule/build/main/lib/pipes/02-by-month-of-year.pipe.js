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
Object.defineProperty(exports, "__esModule", { value: true });
var interfaces_1 = require("./interfaces");
var ByMonthOfYearPipe = /** @class */ (function (_super) {
    __extends(ByMonthOfYearPipe, _super);
    function ByMonthOfYearPipe() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.upcomingMonths = [];
        return _this;
    }
    ByMonthOfYearPipe.prototype.run = function (args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (this.options.frequency === 'YEARLY') {
            return this.expand(args);
        }
        else
            return this.filter(args);
    };
    ByMonthOfYearPipe.prototype.expand = function (args) {
        var date = args.date;
        if (this.upcomingMonths.length === 0) {
            this.upcomingMonths = this.options.byMonthOfYear.filter(function (month) { return date.get('month') <= month; });
            if (this.upcomingMonths.length === 0) {
                return this.nextPipe.run({ date: date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byDayOfMonth || this.options.byDayOfWeek)
                date.set('day', 1);
            if (this.options.byHourOfDay)
                date.set('hour', 0);
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        var nextMonth = this.upcomingMonths.shift();
        date.set('month', nextMonth);
        if (this.upcomingMonths.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date: date });
    };
    ByMonthOfYearPipe.prototype.filter = function (args) {
        var e_1, _a;
        var validMonth = false;
        var nextValidMonthThisYear = null;
        try {
            // byMonthOfYear array is sorted
            for (var _b = __values(this.options.byMonthOfYear), _c = _b.next(); !_c.done; _c = _b.next()) {
                var month = _c.value;
                if (args.date.get('month') === month) {
                    validMonth = true;
                    break;
                }
                else if (args.date.get('month') < month) {
                    nextValidMonthThisYear = month;
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (validMonth)
            return this.nextPipe.run({ date: args.date });
        var next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the year?
        //
        // - We know the current `options.frequency` is not yearly
        if (nextValidMonthThisYear !== null) {
            // if yes, advance the current date forward to the next month which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'month');
            next.set('month', nextValidMonthThisYear);
        }
        else {
            // if no, advance the current date forward one year &
            // and set the date to whatever month would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'year');
            next.add(1, 'year');
            next.set('month', this.options.byMonthOfYear[0]);
        }
        return this.nextPipe.run({ invalidDate: true, skipToIntervalOnOrAfter: next, date: args.date });
    };
    return ByMonthOfYearPipe;
}(interfaces_1.PipeRule));
exports.ByMonthOfYearPipe = ByMonthOfYearPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDItYnktbW9udGgtb2YteWVhci5waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9waXBlcy8wMi1ieS1tb250aC1vZi15ZWFyLnBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLDJDQUE4RDtBQUU5RDtJQUFpRSxxQ0FBVztJQUE1RTtRQUFBLHFFQTZFQztRQW5FUyxvQkFBYyxHQUF5QixFQUFFLENBQUE7O0lBbUVuRCxDQUFDO0lBM0VDLCtCQUFHLEdBQUgsVUFBSSxJQUFtQjtRQUNyQixJQUFJLElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVwRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLFFBQVEsRUFBRTtZQUN2QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDekI7O1lBQU0sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ2pDLENBQUM7SUFHRCxrQ0FBTSxHQUFOLFVBQU8sSUFBbUI7UUFDeEIsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtRQUV0QixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNwQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYyxDQUFDLE1BQU0sQ0FBQyxVQUFBLEtBQUssSUFBSSxPQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxFQUExQixDQUEwQixDQUFDLENBQUE7WUFFN0YsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3BDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFB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