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
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var pipes_1 = require("../pipes");
var rule_options_1 = require("./rule-options");
var ical_1 = require("../ical");
var interfaces_1 = require("../interfaces");
var lodash_uniqwith_1 = __importDefault(require("lodash.uniqwith"));
var utilities_1 = require("../utilities");
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule(options) {
        var _this = _super.call(this) || this;
        _this.usedPipeControllers = []; // only so that we can invalidate them, if necessary
        _this.options = options;
        return _this;
    }
    Object.defineProperty(Rule.prototype, "options", {
        /**
         * NOTE: The options object is frozen. To make changes you must assign a new options object.
         */
        get: function () {
            return this._options;
        },
        set: function (value) {
            // the old pipe controllers become invalid when the options change.
            // just to make sure someone isn't still using an old iterator function,
            // we mark the old controllers as invalid.
            // Yay for forseeing/preventing possible SUPER annoying bugs!!!
            this.usedPipeControllers.forEach(function (controller) { return (controller.invalid = true); });
            this.usedPipeControllers = [];
            this.processedOptions = rule_options_1.buildValidatedRuleOptions(value);
            this._options = Object.freeze(__assign({}, value));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rule.prototype, "isInfinite", {
        get: function () {
            return this.options.until === undefined && this.options.count === undefined;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rule.prototype, "startDate", {
        /** From `options.start`. Note: you should not mutate the start date directly */
        get: function () {
            return this.options.start;
        },
        enumerable: true,
        configurable: true
    });
    Rule.prototype.occurrences = function (args) {
        if (args === void 0) { args = {}; }
        return new interfaces_1.OccurrenceIterator(this, args);
    };
    /**  @private use occurrences() instead */
    Rule.prototype._run = function (args) {
        var controller, iterator, date;
        if (args === void 0) { args = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller = new pipes_1.PipeController(this.processedOptions, args);
                    this.usedPipeControllers.push(controller);
                    iterator = controller._run();
                    date = iterator.next().value;
                    _a.label = 1;
                case 1:
                    if (!date) return [3 /*break*/, 3];
                    date.rule = this;
                    return [4 /*yield*/, date];
                case 2:
                    _a.sent();
                    date = iterator.next().value;
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    };
    Rule.prototype.toICal = function () {
        return '';
    };
    return Rule;
}(interfaces_1.HasOccurrences));
exports.Rule = Rule;
var RRule = /** @class */ (function (_super) {
    __extends(RRule, _super);
    function RRule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RRule.prototype.toICal = function () {
        return ical_1.ruleOptionsToIcalString(this.options, 'RRULE');
    };
    return RRule;
}(Rule));
exports.RRule = RRule;
/**
 * This base class provides an iterable wrapper around the RDATEs array so that
 * it can be interacted with in the same manner as `Rule`
 */
var RDatesBase = /** @class */ (function (_super) {
    __extends(RDatesBase, _super);
    function RDatesBase(dates) {
        var _this = _super.call(this) || this;
        _this.dates = dates;
        _this.isInfinite = false;
        return _this;
    }
    Object.defineProperty(RDatesBase.prototype, "length", {
        get: function () {
            return this.dates.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RDatesBase.prototype, "startDate", {
        get: function () {
            return utilities_1.Utils.getEarliestDate(this.dates);
        },
        enumerable: true,
        configurable: true
    });
    RDatesBase.prototype.occurrences = function (args) {
        if (args === void 0) { args = {}; }
        return new interfaces_1.OccurrenceIterator(this, args);
    };
    RDatesBase.prototype._run = function (args) {
        var dates, date;
        if (args === void 0) { args = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dates = utilities_1.Utils.sortDates(lodash_uniqwith_1.default(this.dates, function (a, b) { return a.isEqual(b); }));
                    if (args.start)
                        dates = dates.filter(function (date) { return date.isAfterOrEqual(args.start); });
                    if (args.end)
                        dates = dates.filter(function (date) { return date.isBeforeOrEqual(args.end); });
                    if (args.take)
                        dates = dates.slice(0, args.take);
                    date = dates.shift();
                    _a.label = 1;
                case 1:
                    if (!date) return [3 /*break*/, 3];
                    return [4 /*yield*/, date];
                case 2:
                    _a.sent();
                    date = dates.shift();
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    };
    RDatesBase.prototype.toICal = function () {
        return '';
    };
    return RDatesBase;
}(interfaces_1.HasOccurrences));
exports.RDatesBase = RDatesBase;
var RDates = /** @class */ (function (_super) {
    __extends(RDates, _super);
    function RDates() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RDates.prototype.toICal = function () {
        return ical_1.datesToIcalString(this.dates, 'RDATE');
    };
    return RDates;
}(RDatesBase));
exports.RDates = RDates;
var EXDates = /** @class */ (function (_super) {
    __extends(EXDates, _super);
    function EXDates() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EXDates.prototype.toICal = function () {
        return ical_1.datesToIcalString(this.dates, 'EXDATE');
    };
    return EXDates;
}(RDatesBase));
exports.EXDates = EXDates;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcnVsZS9ydWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0NBQXlDO0FBQ3pDLCtDQUFtRTtBQUVuRSxnQ0FBb0U7QUFDcEUsNENBT3NCO0FBQ3RCLG9FQUFzQztBQUN0QywwQ0FBb0M7QUFFcEM7SUFBa0Ysd0JBQWlCO0lBb0NqRyxjQUFZLE9BQW1DO1FBQS9DLFlBQ0UsaUJBQU8sU0FFUjtRQU5PLHlCQUFtQixHQUF3QixFQUFFLENBQUEsQ0FBQyxvREFBb0Q7UUFLeEcsS0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7O0lBQ3hCLENBQUM7SUFqQ0Qsc0JBQUkseUJBQU87UUFIWDs7V0FFRzthQUNIO1lBQ0UsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFBO1FBQ3RCLENBQUM7YUFDRCxVQUFZLEtBQWlDO1lBQzNDLG1FQUFtRTtZQUNuRSx3RUFBd0U7WUFDeEUsMENBQTBDO1lBQzFDLCtEQUErRDtZQUMvRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLFVBQUEsVUFBVSxJQUFJLE9BQUEsQ0FBQyxVQUFVLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxFQUEzQixDQUEyQixDQUFDLENBQUE7WUFDM0UsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEVBQUUsQ0FBQTtZQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsd0NBQXlCLENBQUMsS0FBSyxDQUFDLENBQUE7WUFFeEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxjQUFNLEtBQUssRUFBRyxDQUFBO1FBQzdDLENBQUM7OztPQVhBO0lBYUQsc0JBQUksNEJBQVU7YUFBZDtZQUNFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssU0FBUyxJQUFJLElBQUksQ0FB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