"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var _02_by_month_of_year_pipe_1 = require("./02-by-month-of-year.pipe");
var _05_by_day_of_month_pipe_1 = require("./05-by-day-of-month.pipe");
var _06_by_day_of_week_pipe_1 = require("./06-by-day-of-week.pipe");
var _07_by_hour_of_day_pipe_1 = require("./07-by-hour-of-day.pipe");
var _08_by_minute_of_hour_pipe_1 = require("./08-by-minute-of-hour.pipe");
var _09_by_second_of_minute_pipe_1 = require("./09-by-second-of-minute.pipe");
var _01_frequency_pipe_1 = require("./01-frequency.pipe");
var _11_result_pipe_1 = require("./11-result.pipe");
/**
 * Steps
 *
 * 1. Figure out start date and, optionally, end date
 * 2. Figure out which months are applicable to that start date and end date
 * 3. remove `byMonthOfYear` months that aren't applicable
 *
 * - for whatever `byXXX` rules aren't supplied, have pipes at the end that fill
 *   in the date with the appropriate bits of the starting date.
 *
 * - the start date needs to be a valid occurrence
 */
var PipeController = /** @class */ (function () {
    function PipeController(options, args) {
        this.options = options;
        this.isIteratingInReverseOrder = false;
        this.expandingPipes = [];
        /**
         * If the parent of this pipe controller (`Rule` object) changes the `options` object
         * this pipe controller will be invalid. To prevent someone from accidently continuing
         * to use an invalid iterator, we invalidate the old one so it will throw an error.
         */
        this.invalid = false;
        this.pipes = [];
        var frequencyPipe = new _01_frequency_pipe_1.FrequencyPipe(this);
        this.expandingPipes.push(frequencyPipe);
        this.addPipe(frequencyPipe);
        // The ordering is defined in the ICAL spec https://tools.ietf.org/html/rfc5545#section-3.3.10
        if (this.options.byMonthOfYear !== undefined)
            this.addPipe(new _02_by_month_of_year_pipe_1.ByMonthOfYearPipe(this));
        if (this.options.byDayOfMonth !== undefined)
            this.addPipe(new _05_by_day_of_month_pipe_1.ByDayOfMonthPipe(this));
        if (this.options.byDayOfWeek !== undefined)
            this.addPipe(new _06_by_day_of_week_pipe_1.ByDayOfWeekPipe(this));
        if (this.options.byHourOfDay !== undefined)
            this.addPipe(new _07_by_hour_of_day_pipe_1.ByHourOfDayPipe(this));
        if (this.options.byMinuteOfHour !== undefined)
            this.addPipe(new _08_by_minute_of_hour_pipe_1.ByMinuteOfHourPipe(this));
        if (this.options.bySecondOfMinute !== undefined)
            this.addPipe(new _09_by_second_of_minute_pipe_1.BySecondOfMinutePipe(this));
        this.addPipe(new _11_result_pipe_1.ResultPipe(this));
        this.isIteratingInReverseOrder = !!args.reverse;
        this.setStartDate(args.start);
        this.setEndDate(args.end);
        this.setCount(args.take);
    }
    Object.defineProperty(PipeController.prototype, "focusedPipe", {
        get: function () {
            return this.expandingPipes[this.expandingPipes.length - 1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PipeController.prototype, "startDate", {
        // to conform to the `RunnableIterator` interface
        get: function () {
            return this.start;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PipeController.prototype, "isInfinite", {
        get: function () {
            return !this.end && this.count === undefined;
        },
        enumerable: true,
        configurable: true
    });
    PipeController.prototype._run = function () {
        var date, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    date = this.focusedPipe.run({ skipToIntervalOnOrAfter: this.start });
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!(date && (this.count === undefined || index < this.count))) return [3 /*break*/, 5];
                    index++;
                    if (!(date && this.end && date.isAfter(this.end))) return [3 /*break*/, 2];
                    date = null;
                    return [3 /*break*/, 4];
                case 2:
                    if (!date) return [3 /*break*/, 4];
                    return [4 /*yield*/, date.clone()];
                case 3:
                    _a.sent();
                    date = this.focusedPipe.run({ date: date });
                    _a.label = 4;
                case 4: return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    };
    PipeController.prototype.addPipe = function (pipe) {
        var lastPipe = this.pipes[this.pipes.length - 1];
        this.pipes.push(pipe);
        if (lastPipe) {
            lastPipe.nextPipe = pipe;
        }
    };
    PipeController.prototype.setStartDate = function (date) {
        this.start =
            date && date.isAfterOrEqual(this.options.start) ? date.clone() : this.options.start.clone();
    };
    PipeController.prototype.setEndDate = function (date) {
        if (date && this.options.until)
            this.end = date.isBefore(this.options.until) ? date.clone() : this.options.until.clone();
        else if (this.options.until)
            this.end = this.options.until.clone();
        else if (date)
            this.end = date.clone();
    };
    PipeController.prototype.setCount = function (take) {
        if (take !== undefined && this.options.count !== undefined)
            this.count = take > this.options.count ? this.options.count : take;
        else if (take !== undefined)
            this.count = take;
        else if (this.options.count !== undefined)
            this.count = this.options.count;
    };
    return PipeController;
}());
exports.PipeController = PipeController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS1jb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9waXBlcy9waXBlLWNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQSx3RUFBOEQ7QUFDOUQsc0VBQTREO0FBQzVELG9FQUEwRDtBQUMxRCxvRUFBMEQ7QUFDMUQsMEVBQWdFO0FBQ2hFLDhFQUFvRTtBQUNwRSwwREFBbUQ7QUFDbkQsb0RBQTZDO0FBRzdDOzs7Ozs7Ozs7OztHQVdHO0FBRUg7SUErQkUsd0JBQ1MsT0FBb0MsRUFDM0MsSUFBOEQ7UUFEdkQsWUFBTyxHQUFQLE9BQU8sQ0FBNkI7UUEzQnRDLDhCQUF5QixHQUFHLEtBQUssQ0FBQTtRQUVqQyxtQkFBYyxHQUFtQixFQUFFLENBQUE7UUFXMUM7Ozs7V0FJRztRQUNJLFlBQU8sR0FBRyxLQUFLLENBQUE7UUFNZCxVQUFLLEdBQW1CLEVBQUUsQ0FBQTtRQU1oQyxJQUFNLGFBQWEsR0FBRyxJQUFJLGtDQUFhLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFN0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7UUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUUzQiw4RkFBOEY7UUFDOUYsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsS0FBSyxTQUFTO1lBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLDZDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7UUFDdkYsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksS0FBSyxTQUFTO1lBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLDJDQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7UUFDckYsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsS0FBSyxTQUFTO1lBQUUs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