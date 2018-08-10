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
var ByMinuteOfHourPipe = /** @class */ (function (_super) {
    __extends(ByMinuteOfHourPipe, _super);
    function ByMinuteOfHourPipe() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.upcomingMinutes = [];
        return _this;
    }
    ByMinuteOfHourPipe.prototype.run = function (args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (['MINUTELY', 'SECONDLY'].includes(this.options.frequency)) {
            return this.filter(args);
        }
        else
            return this.expand(args);
    };
    ByMinuteOfHourPipe.prototype.expand = function (args) {
        var date = args.date;
        if (this.upcomingMinutes.length === 0) {
            this.upcomingMinutes = this.options.byMinuteOfHour.filter(function (minute) { return date.get('minute') <= minute; });
            if (this.upcomingMinutes.length === 0) {
                return this.nextPipe.run({ date: date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        else {
            if (this.options.bySecondOfMinute)
                date.set('second', 0);
        }
        var nextMinute = this.upcomingMinutes.shift();
        date.set('minute', nextMinute);
        if (this.upcomingMinutes.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date: date });
    };
    ByMinuteOfHourPipe.prototype.filter = function (args) {
        var e_1, _a;
        var validMinute = false;
        var nextValidMinuteThisHour = null;
        try {
            // byMinuteOfHour array is sorted
            for (var _b = __values(this.options.byMinuteOfHour), _c = _b.next(); !_c.done; _c = _b.next()) {
                var minute = _c.value;
                if (args.date.get('minute') === minute) {
                    validMinute = true;
                    break;
                }
                else if (args.date.get('minute') < minute) {
                    nextValidMinuteThisHour = minute;
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
        if (validMinute)
            return this.nextPipe.run({ date: args.date });
        var next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the hour?
        if (nextValidMinuteThisHour !== null) {
            // if yes, advance the current date forward to the next minute which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'minute');
            next.set('minute', nextValidMinuteThisHour);
        }
        else {
            // if no, advance the current date forward one hour &
            // and set the date to whatever minute would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'hour');
            next.add(1, 'hour');
            next.set('minute', this.options.byMinuteOfHour[0]);
        }
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    };
    return ByMinuteOfHourPipe;
}(interfaces_1.PipeRule));
exports.ByMinuteOfHourPipe = ByMinuteOfHourPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDgtYnktbWludXRlLW9mLWhvdXIucGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcGlwZXMvMDgtYnktbWludXRlLW9mLWhvdXIucGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQThEO0FBRzlEO0lBQWtFLHNDQUFXO0lBQTdFO1FBQUEscUVBOEVDO1FBcEVTLHFCQUFlLEdBQTZCLEVBQUUsQ0FBQTs7SUFvRXhELENBQUM7SUE1RUMsZ0NBQUcsR0FBSCxVQUFJLElBQW1CO1FBQ3JCLElBQUksSUFBSSxDQUFDLFdBQVc7WUFBRSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRXBELElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDN0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQ3pCOztZQUFNLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBR0QsbUNBQU0sR0FBTixVQUFPLElBQW1CO1FBQ3hCLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7UUFFdEIsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDckMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWUsQ0FBQyxNQUFNLENBQ3hELFVBQUEsTUFBTSxJQUFJLE9BQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxNQUFNLEVBQTVCLENBQTRCLENBQ3ZDLENBQUE7WUFFRCxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDckMs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