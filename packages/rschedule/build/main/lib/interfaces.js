"use strict";
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
var HasOccurrences = /** @class */ (function () {
    function HasOccurrences() {
    }
    // just to satisfy the interface
    HasOccurrences.prototype.occurrences = function (args) {
        return args;
    };
    HasOccurrences.prototype.occursBetween = function (start, end, options) {
        if (options === void 0) { options = {}; }
        var e_1, _a;
        try {
            for (var _b = __values(this.occurrences({ start: start, end: end })), _c = _b.next(); !_c.done; _c = _b.next()) {
                var day = _c.value;
                if (options.excludingEnds) {
                    if (day.isEqual(start))
                        continue;
                    if (day.isEqual(end))
                        break;
                }
                return true;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return false;
    };
    HasOccurrences.prototype.occursOn = function (date) {
        var e_2, _a;
        try {
            for (var _b = __values(this.occurrences({ start: date, end: date })), _c = _b.next(); !_c.done; _c = _b.next()) {
                var day = _c.value;
                return !!day;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return false;
    };
    HasOccurrences.prototype.occursAfter = function (date, options) {
        if (options === void 0) { options = {}; }
        var e_3, _a;
        try {
            for (var _b = __values(this.occurrences({ start: date })), _c = _b.next(); !_c.done; _c = _b.next()) {
                var day = _c.value;
                if (options.excludeStart && day.isEqual(date))
                    continue;
                return true;
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return false;
    };
    return HasOccurrences;
}());
exports.HasOccurrences = HasOccurrences;
var OccurrenceIterator = /** @class */ (function () {
    function OccurrenceIterator(iterable, args) {
        var _this = this;
        this.iterable = iterable;
        this.args = args;
        this[Symbol.iterator] = function () { return _this.iterator; };
        this.iterator = iterable._run(args);
    }
    OccurrenceIterator.prototype.next = function () {
        return this.iterator.next();
    };
    OccurrenceIterator.prototype.toArray = function () {
        var e_4, _a;
        if (!this.args.end && !this.args.take && this.iterable.isInfinite)
            return undefined;
        else {
            var occurrences = [];
            try {
                for (var _b = __values(this.iterable._run(this.args)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var date = _c.value;
                    occurrences.push(date);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return occurrences;
        }
    };
    return OccurrenceIterator;
}());
exports.OccurrenceIterator = OccurrenceIterator;
// export class UndefinedIterator implements IterableIterator<undefined> {
//   [Symbol.iterator] = this.iterate
//   next() { return { value: undefined, done: true } }
//   toArray() { return undefined }
//   *iterate() {
//     while (false) {
//       yield undefined
//     }
//   }
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaW50ZXJmYWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUF5QkE7SUFBQTtJQWdDQSxDQUFDO0lBL0JDLGdDQUFnQztJQUNoQyxvQ0FBVyxHQUFYLFVBQVksSUFBUztRQUNuQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxzQ0FBYSxHQUFiLFVBQWMsS0FBUSxFQUFFLEdBQU0sRUFBRSxPQUF5QztRQUF6Qyx3QkFBQSxFQUFBLFlBQXlDOzs7WUFDdkUsS0FBa0IsSUFBQSxLQUFBLFNBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssT0FBQSxFQUFFLEdBQUcsS0FBQSxFQUFFLENBQUMsQ0FBQSxnQkFBQSw0QkFBRTtnQkFBL0MsSUFBTSxHQUFHLFdBQUE7Z0JBQ1osSUFBSSxPQUFPLENBQUMsYUFBYSxFQUFFO29CQUN6QixJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO3dCQUFFLFNBQVE7b0JBQ2hDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7d0JBQUUsTUFBSztpQkFDNUI7Z0JBRUQsT0FBTyxJQUFJLENBQUE7YUFDWjs7Ozs7Ozs7O1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsaUNBQVEsR0FBUixVQUFTLElBQU87OztZQUNkLEtBQWtCLElBQUEsS0FBQSxTQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBLGdCQUFBLDRCQUFFO2dCQUEzRCxJQUFNLEdBQUcsV0FBQTtnQkFDWixPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUE7YUFDYjs7Ozs7Ozs7O1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsb0NBQVcsR0FBWCxVQUFZLElBQU8sRUFBRSxPQUF3QztRQUF4Qyx3QkFBQSxFQUFBLFlBQXdDOzs7WUFDM0QsS0FBa0IsSUFBQSxLQUFBLFNBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBLGdCQUFBLDRCQUFFO2dCQUFoRCxJQUFNLEdBQUcsV0FBQTtnQkFDWixJQUFJLE9BQU8sQ0FBQyxZQUFZLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7b0JBQUUsU0FBUTtnQkFDdkQsT0FBTyxJQUFJLENBQUE7YUFDWjs7Ozs7Ozs7O1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBQ0gscUJBQUM7QUFBRCxDQUFDLEFBaENELElBZ0NDO0FBaENxQix3Q0FBYztBQWtDcEM7SUFHRSw0QkFBb0IsUUFBVyxFQUFVLElBQXdCO1FBQWpFLGlCQUVDO1FBRm1CLGFBQVEsR0FBUixRQUFRLENBQUc7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFvQjtRQUlqRSxLQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxjQUFNLE9BQUEsS0FBSSxDQUFDLFFBQVEsRUFBYixDQUFhLENBQUE7UUFIckMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3JDLENBQUM7SUFJRCxpQ0FBSSxHQUFKO1FBQ0UsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFBO0lBQzdCLENBQUM7SUFFRCxvQ0FBTyxHQUFQOztRQUNFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtZQUFFLE9BQU8sU0FBUyxDQUFBO2FBQzlFO1lBQ0gsSUFBTSxXQUFXLEdBQVEsRUFBRSxDQUFBOztnQkFDM0IsS0FBbUIsSUFBQSxLQUFBLFNBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBLGdCQUFBLDRCQUFFO29CQUE3QyxJQUFNLElBQUksV0FBQTtvQkFDYixXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2lCQUN2Qjs7Ozs7Ozs7O1lBQ0QsT0FBTyxXQUFXLENBQUE7U0FDbkI7SUFDSCxDQUFDO0lBQ0gseUJBQUM7QUFBRCxDQUFDLEFBdkJELElBdUJDO0FBdkJZLGdEQUFrQjtBQXlCL0IsMEVBQTBFO0FBQzFFLHFDQUFxQztBQUVyQyx1REFBdUQ7QUFFdkQsbUNBQW1DO0FBRW5DLGlCQUFpQjtBQUNqQixzQkFBc0I7QUFDdEIsd0JBQXdCO0FBQ3hCLFFBQVE7QUFDUixNQUFNO0FBQ04sSUFBSSJ9