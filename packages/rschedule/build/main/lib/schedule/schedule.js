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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
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
var rule_1 = require("../rule");
var parser_1 = require("../ical/parser");
var interfaces_1 = require("../interfaces");
var utilities_1 = require("../utilities");
var Schedule = /** @class */ (function (_super) {
    __extends(Schedule, _super);
    function Schedule(args) {
        var _this = _super.call(this) || this;
        _this.rrules = [];
        _this.rdates = new rule_1.RDates([]);
        _this.exdates = new rule_1.EXDates([]);
        if (args) {
            if (args.rrules)
                _this.rrules = args.rrules.map(function (options) { return new rule_1.RRule(options); });
            if (args.rdates)
                _this.rdates = new rule_1.RDates(args.rdates);
            if (args.exdates)
                _this.exdates = new rule_1.EXDates(args.exdates);
        }
        return _this;
    }
    Object.defineProperty(Schedule.prototype, "startDate", {
        /**
         * The start date is the earliest RDATE or RRULE start date. The first valid
         * occurrence of the schedule does not necessarily equal the start date because
         * exdates are not taken into consideration.
         */
        get: function () {
            var dates = this.rrules.map(function (rule) { return rule.startDate; });
            dates.push.apply(dates, __spread(this.rdates.dates));
            return utilities_1.Utils.getEarliestDate(dates);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Schedule.prototype, "isInfinite", {
        get: function () {
            return this.rrules.some(function (rule) { return rule.isInfinite; });
        },
        enumerable: true,
        configurable: true
    });
    Schedule.fromICal = function (icals, dateAdapterConstructor) {
        if (!Array.isArray(icals))
            icals = [icals];
        var options = parser_1.parseICalStrings(icals, dateAdapterConstructor);
        return new Schedule(options);
    };
    Schedule.prototype.toICal = function () {
        var icals = [];
        this.rrules.forEach(function (rule) { return icals.push(rule.toICal()); });
        if (this.rdates.length > 0)
            icals.push(this.rdates.toICal());
        if (this.exdates.length > 0)
            icals.push(this.exdates.toICal());
        return icals;
    };
    Schedule.prototype.occurrences = function (args) {
        if (args === void 0) { args = {}; }
        return new interfaces_1.OccurrenceIterator(this, args);
    };
    /**  @private use occurrences() instead */
    Schedule.prototype._run = function (args) {
        var _a, _b, positiveIterators, exdates, cache, next, mustFilter, count, index;
        if (args === void 0) { args = {}; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    positiveIterators = this.rrules.slice();
                    positiveIterators.push(this.rdates);
                    exdates = this.exdates.dates.slice();
                    cache = positiveIterators
                        .map(function (obj) {
                        var iterator = obj.occurrences(args);
                        return {
                            iterator: iterator,
                            date: iterator.next().value,
                        };
                    })
                        // remove any iterators which don't have any upcoming dates from the cache
                        .filter(function (item) { return !!item.date; });
                    mustFilter = false;
                    // just return void if the cache is empty (indicating that this schedule has
                    // no RRule / RDates objects
                    if (cache.length === 0)
                        return [2 /*return*/];
                    else {
                        // Selecting the first cache object is rather arbitrary
                        // The only imporant thing is that our initial select
                        //   1. has a date
                        //   2. that date is not also an EXDATE
                        next = getFirstIteratorCacheObj(cache, exdates);
                        if (!next)
                            return [2 /*return*/];
                        _a = __read(getNextIteratorCacheObj(next, cache, exdates), 2), next = _a[0], mustFilter = _a[1];
                    }
                    count = args.take;
                    index = 0;
                    _c.label = 1;
                case 1:
                    if (!(next.date && (count === undefined || count > index))) return [3 /*break*/, 3];
                    // add this schedule to the metadata
                    next.date.schedule = this;
                    // yield the selected cache object's date to the user
                    return [4 /*yield*/, next.date.clone()
                        // iterate the date on the selected cache object
                    ];
                case 2:
                    // yield the selected cache object's date to the user
                    _c.sent();
                    // iterate the date on the selected cache object
                    next.date = next.iterator.next().value;
                    if (!next.date || mustFilter) {
                        // if the selected cache object now doesn't have a date,
                        // remove it from the cache and arbitrarily select another one
                        cache = cache.filter(function (cacheObj) { return !!cacheObj.date; });
                        next = cache[0];
                        // if there are no more cache objects, end iteration
                        if (cache.length === 0)
                            return [3 /*break*/, 3];
                    }
                    // select the next upcoming cache object from the cache
                    ;
                    _b = __read(getNextIteratorCacheObj(next, cache, exdates), 2), next = _b[0], mustFilter = _b[1];
                    index++;
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    };
    return Schedule;
}(interfaces_1.HasOccurrences));
exports.Schedule = Schedule;
/**
 * Selecting the first cache object is rather arbitrary
 * The only imporant thing is that our initial select
 *   1. has a date
 *   2. that date is not also an EXDATE
 */
function getFirstIteratorCacheObj(cache, exdates) {
    var first = cache[0];
    getNextDateThatIsNotInExdates(first, exdates);
    while (!first.date && cache.length > 1) {
        cache.shift();
        first = cache[0];
        getNextDateThatIsNotInExdates(first, exdates);
    }
    if (!first.date)
        return null;
    // remove past (i.e. no longer applicable exdates from our exdates array)
    removePastExDates(first.date, exdates);
    return first;
}
/**
 * This function gets the next item from our iterator cache and
 * also removes past (i.e. no longer applicable) exdates from our
 * exdates array.
 */
function getNextIteratorCacheObj(next, cache, exdates) {
    var mustFilter = false;
    if (cache.length === 1) {
        next = cache[0];
        getNextDateThatIsNotInExdates(next, exdates);
    }
    else {
        // don't include the `next` iterator in the cache, since it is injected into the
        // reducer as the first item
        cache = cache.filter(function (item) { return item !== next; });
        // select the next upcoming cache object from the cache
        next = cache.reduce(function (prev, curr) {
            if (!getNextDateThatIsNotInExdates(curr, exdates))
                return prev;
            else if (curr.date.isBefore(prev.date))
                return curr;
            else if (curr.date.isEqual(prev.date)) {
                curr.date = curr.iterator.next().value;
                // ^ curr.date could be undefined, so need to remember
                // to filter away iterators with undefiend dates later
                mustFilter = true;
                return prev;
            }
            else
                return prev;
        }, next);
    }
    // remove past (i.e. no longer applicable exdates from our exdates array)
    removePastExDates(next.date, exdates);
    return [next, mustFilter];
}
function getNextDateThatIsNotInExdates(cacheObj, exdates) {
    if (cacheObj.date && dateIsInExDates(cacheObj.date, exdates)) {
        cacheObj.date = cacheObj.iterator.next().value;
        return getNextDateThatIsNotInExdates(cacheObj, exdates);
    }
    else
        return cacheObj.date;
}
function dateIsInExDates(date, exdates) {
    var e_1, _a;
    try {
        for (var exdates_1 = __values(exdates), exdates_1_1 = exdates_1.next(); !exdates_1_1.done; exdates_1_1 = exdates_1.next()) {
            var exdate = exdates_1_1.value;
            if (date.isEqual(exdate))
                return true;
            else if (date.isAfter(exdate))
                break;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (exdates_1_1 && !exdates_1_1.done && (_a = exdates_1.return)) _a.call(exdates_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return false;
}
function removePastExDates(date, exdates) {
    var e_2, _a;
    if (!date)
        return;
    var exdatesToBeRemoved = [];
    try {
        for (var exdates_2 = __values(exdates), exdates_2_1 = exdates_2.next(); !exdates_2_1.done; exdates_2_1 = exdates_2.next()) {
            var exdate = exdates_2_1.value;
            if (date.isBeforeOrEqual(exdate))
                break;
            else if (date.isAfter(exdate))
                exdatesToBeRemoved.push(exdate);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (exdates_2_1 && !exdates_2_1.done && (_a = exdates_2.return)) _a.call(exdates_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    exdatesToBeRemoved.forEach(function (exdate) {
        var index = exdates.indexOf(exdate);
        exdates.splice(index, 1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3NjaGVkdWxlL3NjaGVkdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdDQUFzRDtBQUV0RCx5Q0FBaUQ7QUFDakQsNENBT3NCO0FBQ3RCLDBDQUFvQztBQUVwQztJQUNVLDRCQUFpQjtJQXdCekIsa0JBQVksSUFBNkU7UUFBekYsWUFDRSxpQkFBTyxTQU1SO1FBN0JNLFlBQU0sR0FBZSxFQUFFLENBQUE7UUFDdkIsWUFBTSxHQUFjLElBQUksYUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2xDLGFBQU8sR0FBZSxJQUFJLGNBQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQXNCMUMsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLElBQUksQ0FBQyxNQUFNO2dCQUFFLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQSxPQUFPLElBQUksT0FBQSxJQUFJLFlBQUssQ0FBQyxPQUFPLENBQUMsRUFBbEIsQ0FBa0IsQ0FBQyxDQUFBO1lBQzdFLElBQUksSUFBSSxDQUFDLE1BQU07Z0JBQUUsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGFBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDdEQsSUFBSSxJQUFJLENBQUMsT0FBTztnQkFBRSxLQUFJLENBQUMsT0FBTyxHQUFHLElBQUksY0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtTQUMzRDs7SUFDSCxDQUFDO0lBakJELHNCQUFJLCtCQUFTO1FBTGI7Ozs7V0FJRzthQUNIO1lBQ0UsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQSxJQUFJLElBQUksT0FB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