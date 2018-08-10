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
var utilities_1 = require("../utilities");
var Collection = /** @class */ (function () {
    function Collection(dates, period, periodStart, periodEnd) {
        if (dates === void 0) { dates = []; }
        this.dates = dates;
        this.period = period;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
    }
    return Collection;
}());
exports.Collection = Collection;
var CollectionIterator = /** @class */ (function () {
    function CollectionIterator(iterable, args) {
        var _a;
        var _this = this;
        this.iterable = iterable;
        this.args = args;
        this.granularity = 'INSTANTANIOUSLY';
        this[Symbol.iterator] = function () { return _this.iterateCollection(_this.iterator); };
        ;
        _a = __read(this.getIterator(iterable, args), 2), this.iterator = _a[0], this.startDate = _a[1];
        if (args.granularity)
            this.granularity = args.granularity;
        if (args.weekStart)
            this.weekStart = args.weekStart;
    }
    CollectionIterator.prototype.iterateCollection = function (iterator) {
        var date, periodStart, periodEnd, dates, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!this.startDate)
                        return [2 /*return*/];
                    date = iterator.next().value;
                    if (!date)
                        return [2 /*return*/];
                    periodStart = this.getPeriodStart(date);
                    periodEnd = this.getPeriodEnd(periodStart);
                    dates = [];
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!(date && (this.args.take === undefined || this.args.take > index))) return [3 /*break*/, 3];
                    while (date && date.isBeforeOrEqual(periodEnd)) {
                        dates.push(date);
                        date = iterator.next().value;
                    }
                    return [4 /*yield*/, new Collection(dates, this.granularity, periodStart.clone(), periodEnd.clone())];
                case 2:
                    _a.sent();
                    if (!date)
                        return [2 /*return*/];
                    dates = [];
                    periodStart = this.getPeriodStart(date);
                    periodEnd = this.getPeriodEnd(periodStart);
                    index++;
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    };
    CollectionIterator.prototype.next = function () {
        return this.iterateCollection(this.iterator).next();
    };
    /**
     * While `next()` and `[Symbol.iterator]` both share state,
     * `toArray()` does not share state and always returns the whole
     * collections array (or `undefined`, in the case of collection of
     * infinite length)
     */
    CollectionIterator.prototype.toArray = function () {
        var e_1, _a;
        if (!this.args.end && !this.args.take && this.iterable.isInfinite)
            return undefined;
        else {
            var collections = [];
            var _b = __read(this.getIterator(this.iterable, this.args), 1), iterator = _b[0];
            try {
                for (var _c = __values(this.iterateCollection(iterator)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var collection = _d.value;
                    collections.push(collection);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return collections;
        }
    };
    CollectionIterator.prototype.getPeriodStart = function (date) {
        date = date.clone();
        switch (this.granularity) {
            case 'YEARLY':
                return date.set('month', 1).set('day', 1);
            case 'MONTHLY':
                return date.set('day', 1);
            case 'WEEKLY':
                if (!this.weekStart)
                    throw new Error('"WEEKLY" granularity requires `weekStart` arg');
                var differenceFromWeekStart = utilities_1.Utils.weekdayToInt(date.get('weekday'), this.weekStart);
                date.subtract(differenceFromWeekStart, 'day');
            case 'DAILY':
                return date
                    .set('hour', 0)
                    .set('minute', 0)
                    .set('second', 0)
                    .set('millisecond', 0);
            case 'HOURLY':
                return date
                    .set('minute', 0)
                    .set('second', 0)
                    .set('millisecond', 0);
            case 'MINUTELY':
                return date.set('second', 0).set('millisecond', 0);
            case 'SECONDLY':
                return date.set('millisecond', 0);
            case 'INSTANTANIOUSLY':
            default:
                return date;
        }
    };
    CollectionIterator.prototype.getPeriodEnd = function (start) {
        var periodEnd = start.clone();
        switch (this.granularity) {
            case 'YEARLY':
                return periodEnd.add(1, 'year').subtract(1, 'millisecond');
            case 'MONTHLY':
                return periodEnd.add(1, 'month').subtract(1, 'millisecond');
            case 'WEEKLY':
                return periodEnd.add(7, 'day').subtract(1, 'millisecond');
            case 'DAILY':
                return periodEnd.add(1, 'day').subtract(1, 'millisecond');
            case 'HOURLY':
                return periodEnd.add(1, 'hour').subtract(1, 'millisecond');
            case 'MINUTELY':
                return periodEnd.add(1, 'minute').subtract(1, 'millisecond');
            case 'SECONDLY':
                return periodEnd.add(1, 'second').subtract(1, 'millisecond');
            case 'INSTANTANIOUSLY':
            default:
                return periodEnd;
        }
    };
    CollectionIterator.prototype.getIterator = function (iterable, args) {
        var start = args.start || iterable.startDate;
        if (!start)
            return [iterable._run(args), null];
        start = this.getPeriodStart(start);
        return [
            iterable._run({
                start: start,
                end: args.end,
            }),
            start,
        ];
    };
    return CollectionIterator;
}());
exports.CollectionIterator = CollectionIterator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvY2FsZW5kYXIvY29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0EsMENBQW9DO0FBRXBDO0lBQ0Usb0JBQ2tCLEtBQWUsRUFDZixNQUE2QyxFQUM3QyxXQUFjLEVBQ2QsU0FBWTtRQUhaLHNCQUFBLEVBQUEsVUFBZTtRQUFmLFVBQUssR0FBTCxLQUFLLENBQVU7UUFDZixXQUFNLEdBQU4sTUFBTSxDQUF1QztRQUM3QyxnQkFBVyxHQUFYLFdBQVcsQ0FBRztRQUNkLGNBQVMsR0FBVCxTQUFTLENBQUc7SUFDM0IsQ0FBQztJQUNOLGlCQUFDO0FBQUQsQ0FBQyxBQVBELElBT0M7QUFQWSxnQ0FBVTtBQW1CdkI7SUFNRSw0QkFBb0IsUUFBVyxFQUFVLElBQXdCOztRQUFqRSxpQkFLQztRQUxtQixhQUFRLEdBQVIsUUFBUSxDQUFHO1FBQVUsU0FBSSxHQUFKLElBQUksQ0FBb0I7UUFKakQsZ0JBQVcsR0FBMkIsaUJBQWlCLENBQUE7UUFXdkUsS0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsY0FBTSxPQUFBLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFJLENBQUMsUUFBUSxDQUFDLEVBQXJDLENBQXFDLENBQUM7UUFOOUQsQ0FBQztRQUFBLGdEQUFrRSxFQUFqRSxxQkFBYSxFQUFFLHNCQUFjLENBQW9DO1FBRW5FLElBQUksSUFBSSxDQUFDLFdBQVc7WUFBRSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUE7UUFDekQsSUFBSSxJQUFJLENBQUMsU0FBUztZQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQTtJQUNyRCxDQUFDO0lBSUEsOENBQWlCLEdBQWxCLFVBQW1CLFFBQTZC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