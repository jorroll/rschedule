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
var BySecondOfMinutePipe = /** @class */ (function (_super) {
    __extends(BySecondOfMinutePipe, _super);
    function BySecondOfMinutePipe() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.upcomingSeconds = [];
        return _this;
    }
    BySecondOfMinutePipe.prototype.run = function (args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (this.options.frequency === 'SECONDLY') {
            return this.filter(args);
        }
        else
            return this.expand(args);
    };
    BySecondOfMinutePipe.prototype.expand = function (args) {
        var date = args.date;
        if (this.upcomingSeconds.length === 0) {
            this.upcomingSeconds = this.options.bySecondOfMinute.filter(function (second) { return date.get('second') <= second; });
            if (this.upcomingSeconds.length === 0) {
                return this.nextPipe.run({ date: date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        var nextSecond = this.upcomingSeconds.shift();
        date.set('second', nextSecond);
        if (this.upcomingSeconds.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date: date });
    };
    BySecondOfMinutePipe.prototype.filter = function (args) {
        var e_1, _a;
        var validSecond = false;
        var nextValidSecondThisMinute = null;
        try {
            // bySecondOfMinute array is sorted
            for (var _b = __values(this.options.bySecondOfMinute), _c = _b.next(); !_c.done; _c = _b.next()) {
                var second = _c.value;
                if (args.date.get('second') === second) {
                    validSecond = true;
                    break;
                }
                else if (args.date.get('second') < second) {
                    nextValidSecondThisMinute = second;
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
        if (validSecond)
            return this.nextPipe.run({ date: args.date });
        var next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the minute?
        if (nextValidSecondThisMinute !== null) {
            // if yes, advance the current date forward to the next second which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'second');
            next.set('second', nextValidSecondThisMinute);
        }
        else {
            // if no, advance the current date forward one minute &
            // and set the date to whatever second would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'minute');
            next.add(1, 'minute');
            next.set('second', this.options.bySecondOfMinute[0]);
        }
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    };
    return BySecondOfMinutePipe;
}(interfaces_1.PipeRule));
exports.BySecondOfMinutePipe = BySecondOfMinutePipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDktYnktc2Vjb25kLW9mLW1pbnV0ZS5waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9waXBlcy8wOS1ieS1zZWNvbmQtb2YtbWludXRlLnBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDJDQUE4RDtBQUc5RDtJQUFvRSx3Q0FBVztJQUEvRTtRQUFBLHFFQTRFQztRQWxFUyxxQkFBZSxHQUErQixFQUFFLENBQUE7O0lBa0UxRCxDQUFDO0lBMUVDLGtDQUFHLEdBQUgsVUFBSSxJQUFtQjtRQUNyQixJQUFJLElBQUksQ0FBQyxXQUFXO1lBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVwRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLFVBQVUsRUFBRTtZQUN6QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDekI7O1lBQU0sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ2pDLENBQUM7SUFHRCxxQ0FBTSxHQUFOLFVBQU8sSUFBbUI7UUFDeEIsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtRQUV0QixJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNyQyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWlCLENBQUMsTUFBTSxDQUMxRCxVQUFBLE1BQU0sSUFBSSxPQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksTUFBTSxFQUE1QixDQUE0QixDQUN2QyxDQUFBO1lBRUQsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFH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