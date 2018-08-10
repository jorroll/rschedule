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
Object.defineProperty(exports, "__esModule", { value: true });
var interfaces_1 = require("../interfaces");
var collection_1 = require("./collection");
var utilities_1 = require("../utilities");
var Calendar = /** @class */ (function (_super) {
    __extends(Calendar, _super);
    function Calendar(args) {
        if (args === void 0) { args = {}; }
        var _this = _super.call(this) || this;
        _this.schedules = [];
        if (Array.isArray(args.schedules))
            _this.schedules = args.schedules.slice();
        else if (args.schedules)
            _this.schedules.push(args.schedules);
        return _this;
    }
    Object.defineProperty(Calendar.prototype, "startDate", {
        get: function () {
            return utilities_1.Utils.getEarliestDate(this.schedules
                .map(function (schedule) { return schedule.startDate; })
                .filter(function (date) { return !!date; }));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Calendar.prototype, "isInfinite", {
        get: function () {
            return this.schedules.some(function (schedule) { return schedule.isInfinite; });
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Iterates over the calendar's occurrences and bundles them into collections
     * with a specified granularity (default is `"INSTANTANIOUS"`). Each `Collection`
     * object has:
     *
     *   - a `dates` property containing an array of DateAdapter objects.
     *   - a `period` property containing the granularity.
     *   - a `periodStart` property containing a DateAdapter equal to the period's
     *     start time.
     *   - a `periodEnd` property containing a DateAdapter equal to the period's
     *     end time.
     *
     * The `periodStart` value of `Collection` objects produced by this method does not
     * necessarily increment linearly. A collection *always* contains at least one date,
     * so the `periodStart` from one collection to the next can "jump".
     *
     * Example: If your granularity is `"DAILY"` and you start in January, but the earliest
     * a schedule outputs a date is in February, the first Collection produced will have a
     * `periodStart` in February.
     *
     * Another thing: when giving a `take` argument to `collections()`, you are specifying
     * the number of `Collection` objects to return (rather than occurrences).
     *
     * @param args
     */
    Calendar.prototype.collections = function (args) {
        if (args === void 0) { args = {}; }
        return new collection_1.CollectionIterator(this, args);
    };
    /**
     * Iterates over the calendar's occurrences and simply spits them out in order.
     * Unlike `Schedule#occurrences()`, this method may spit out duplicate dates,
     * each of which are associated with a different `Schedule`. To see what
     * `Schedule` a date is associated with, you may use `DateAdapter#schedule`.
     *
     * @param args
     */
    Calendar.prototype.occurrences = function (args) {
        if (args === void 0) { args = {}; }
        return new interfaces_1.OccurrenceIterator(this, args);
    };
    // `_run()` follows in the footsteps of `Schedule#_run()`,
    // which is fully commented.
    /**  @private use collections() instead */
    Calendar.prototype._run = function (args) {
        var cache, next, count, index;
        if (args === void 0) { args = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cache = this.schedules
                        .map(function (schedule) {
                        var iterator = schedule.occurrences(args);
                        return {
                            iterator: iterator,
                            date: iterator.next().value,
                        };
                    })
                        .filter(function (item) { return !!item.date; });
                    if (cache.length === 0)
                        return [2 /*return*/];
                    else {
                        next = selectNextUpcomingCacheObj(cache[0], cache);
                    }
                    count = args.take;
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!(next.date && (count === undefined || count > index))) return [3 /*break*/, 3];
                    // add the current calendar to the metadata
                    next.date.calendar = this;
                    return [4 /*yield*/, next.date.clone()];
                case 2:
                    _a.sent();
                    next.date = next.iterator.next().value;
                    if (!next.date) {
                        cache = cache.filter(function (item) { return item !== next; });
                        next = cache[0];
                        if (cache.length === 0)
                            return [3 /*break*/, 3];
                    }
                    next = selectNextUpcomingCacheObj(next, cache);
                    index++;
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    };
    return Calendar;
}(interfaces_1.HasOccurrences));
exports.Calendar = Calendar;
function selectNextUpcomingCacheObj(current, cache) {
    if (cache.length === 1)
        return cache[0];
    return cache.reduce(function (prev, curr) {
        if (!curr.date)
            return prev;
        else if (curr.date.isBefore(prev.date))
            return curr;
        else
            return prev;
    }, current);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsZW5kYXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL2NhbGVuZGFyL2NhbGVuZGFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLDRDQU1zQjtBQUN0QiwyQ0FBa0U7QUFDbEUsMENBQW9DO0FBR3BDO0lBQ1UsNEJBQWlCO0lBaUJ6QixrQkFBWSxJQUFzRDtRQUF0RCxxQkFBQSxFQUFBLFNBQXNEO1FBQWxFLFlBQ0UsaUJBQU8sU0FHUjtRQW5CTSxlQUFTLEdBQWtCLEVBQUUsQ0FBQTtRQWlCbEMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFBRSxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUE7YUFDckUsSUFBSSxJQUFJLENBQUMsU0FBUztZQUFFLEtBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTs7SUFDOUQsQ0FBQztJQWRELHNCQUFJLCtCQUFTO2FBQWI7WUFDRSxPQUFPLGlCQUFLLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTO2lCQUN4QyxHQUFHLENBQUMsVUFBQSxRQUFRLElBQUksT0FBQSxRQUFRLENBQUMsU0FBUyxFQUFsQixDQUFrQixDQUFDO2lCQUNuQyxNQUFNLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxDQUFDLENBQUMsSUFBSSxFQUFOLENBQU0sQ0FBUSxDQUFDLENBQUE7UUFDbkMsQ0FBQzs7O09BQUE7SUFFRCxzQkFBSSxnQ0FBVTthQUFkO1lBQ0UsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFBLFFBQVEsSUFBSSxPQUFBLFFBQVEsQ0FBQyxVQUFVLEVBQW5CLENBQW1CLENBQUMsQ0FBQTtRQUM3RCxDQUFDOzs7T0FBQTtJQVFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F3Qkc7SUFDSCw4QkFBVyxHQUFYLFVBQVksSUFBNkI7UUFBN0IscUJBQUEsRUFBQSxTQUE2QjtRQUN2QyxPQUFPLElBQUksK0JBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsOEJBQVcsR0FBWCxVQUFZLElBQTZCO1FBQTdCLHFCQUFBLEVBQUEsU0FBNkI7UUFDdkMsT0FBTyxJQUFJLCtCQUFrQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRUQsMERBQTBEO0lBQzFELDRCQUE0QjtJQUU1QiwwQ0FBMEM7SUFDekMsdUJBQUksR0FBTCxVQUFNLElBQTZCOztRQUE3QixxQkFBQSxFQUFBLFNBQTZCOzs7O29CQUM3QixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVM7eUJBQ3ZCLEdBQUcsQ0FBQyxVQUFBLFFBQVE7d0JBQ1gsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFDM0MsT0FBTzs0QkFDTCxRQUFRLFVBQUE7NEJBQ1IsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLO3lCQUM1QixDQUFBO29CQUNILENBQUMsQ0FBQzt5QkFDRCxNQUFNLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBWCxDQUFXLENBQUMsQ0FBQTtvQkFJOUIsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUM7d0JBQUUsc0JBQU07eUJBQ3pCO3dCQUNILElBQUksR0FBRywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7cUJBQ25EO29CQUVHLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO29CQUNqQixLQUFLLEdBQUcsQ0FBQyxDQUFBOzs7eUJBRU4sQ0FBQSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUE7b0JBQ3hELDJDQUEyQztvQkFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO29CQUV6QixxQkFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFBOztvQkFBdkIsU0FBdUIsQ0FBQTtvQkFFdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQTtvQkFFdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7d0JBQ2QsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBQSxJQUFJLElBQUksT0FBQSxJQUFJLEtBQUssSUFBSSxFQUFiLENBQWEsQ0FBQyxDQUFBO3dCQUMzQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO3dCQUVmLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDOzRCQUFFLHdCQUFLO3FCQUM5QjtvQkFFRCxJQUFJLEdBQUcsMEJBQTBCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO29CQUU5QyxLQUFLLEVBQUUsQ0FBQTs7Ozs7S0FFVjtJQUNILGVBQUM7QUFBRCxDQUFDLEFBOUdELENBQ1UsMkJBQWMsR0E2R3ZCO0FBOUdZLDRCQUFRO0FBZ0hyQixvQ0FDRSxPQUEyRCxFQUMzRCxLQUEyRDtJQUUzRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQztRQUFFLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBRXZDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFDLElBQUksRUFBRSxJQUFJO1FBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSTtZQUFFLE9BQU8sSUFBSSxDQUFBO2FBQ3RCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUssQ0FBQztZQUFFLE9BQU8sSUFBSSxDQUFBOztZQUMvQyxPQUFPLElBQUksQ0FBQTtJQUNsQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUE7QUFDYixDQUFDIn0=