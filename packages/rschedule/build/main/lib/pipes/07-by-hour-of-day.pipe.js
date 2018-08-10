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
var ByHourOfDayPipe = /** @class */ (function (_super) {
    __extends(ByHourOfDayPipe, _super);
    function ByHourOfDayPipe() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.upcomingHours = [];
        return _this;
    }
    ByHourOfDayPipe.prototype.run = function (args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'].includes(this.options.frequency)) {
            return this.expand(args);
        }
        else
            return this.filter(args);
    };
    ByHourOfDayPipe.prototype.expand = function (args) {
        var date = args.date;
        if (this.upcomingHours.length === 0) {
            this.upcomingHours = this.options.byHourOfDay.filter(function (hour) { return date.get('hour') <= hour; });
            if (this.upcomingHours.length === 0) {
                return this.nextPipe.run({ date: date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.byMinuteOfHour)
                date.set('minute', 0);
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        var nextHour = this.upcomingHours.shift();
        date.set('hour', nextHour);
        if (this.upcomingHours.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date: date });
    };
    ByHourOfDayPipe.prototype.filter = function (args) {
        var e_1, _a;
        var validHour = false;
        var nextValidHourThisDay = null;
        try {
            // byHourOfYear array is sorted
            for (var _b = __values(this.options.byHourOfDay), _c = _b.next(); !_c.done; _c = _b.next()) {
                var hour = _c.value;
                if (args.date.get('hour') === hour) {
                    validHour = true;
                    break;
                }
                else if (args.date.get('hour') < hour) {
                    nextValidHourThisDay = hour;
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
        if (validHour)
            return this.nextPipe.run({ date: args.date });
        var next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the year?
        //
        // - We know the current `options.frequency` is not yearly
        if (nextValidHourThisDay !== null) {
            // if yes, advance the current date forward to the next hour which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'hour');
            next.set('hour', nextValidHourThisDay);
        }
        else {
            // if no, advance the current date forward one day &
            // and set the date to whatever hour would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'day');
            next.add(1, 'day');
            next.set('hour', this.options.byHourOfDay[0]);
        }
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    };
    return ByHourOfDayPipe;
}(interfaces_1.PipeRule));
exports.ByHourOfDayPipe = ByHourOfDayPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDctYnktaG91ci1vZi1kYXkucGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcGlwZXMvMDctYnktaG91ci1vZi1kYXkucGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQThEO0FBRzlEO0lBQStELG1DQUFXO0lBQTFFO1FBQUEscUVBOEVDO1FBckVTLG1CQUFhLEdBQTBCLEVBQUUsQ0FBQTs7SUFxRW5ELENBQUM7SUE3RUMsNkJBQUcsR0FBSCxVQUFJLElBQW1CO1FBQ3JCLElBQUksSUFBSSxDQUFDLFdBQVc7WUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRXBELElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUM3RSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDekI7O1lBQU0sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ2pDLENBQUM7SUFHRCxnQ0FBTSxHQUFOLFVBQU8sSUFBbUI7UUFDeEIsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtRQUV0QixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNuQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBWSxDQUFDLE1BQU0sQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxFQUF4QixDQUF3QixDQUFDLENBQUE7WUFFdkYsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sS0FBSyxDQUFD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