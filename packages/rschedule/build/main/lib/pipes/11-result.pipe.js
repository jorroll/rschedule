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
Object.defineProperty(exports, "__esModule", { value: true });
var interfaces_1 = require("./interfaces");
var PipeError = /** @class */ (function (_super) {
    __extends(PipeError, _super);
    function PipeError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PipeError;
}(Error));
exports.PipeError = PipeError;
var ResultPipe = /** @class */ (function (_super) {
    __extends(ResultPipe, _super);
    function ResultPipe() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.invalidIterationCount = 0;
        return _this;
    }
    // This pipe exists to facilitate the adding of dev callbacks to an iteration
    // of the pipe. It is meant to always be the last pipe in the chain.
    ResultPipe.prototype.run = function (args) {
        if (this.controller.invalid) {
            throw "Ooops! You've continued to use a rule iterator object " +
                'after having updated `Rule#options`. ' +
                'See the PipeController#invalid source code for more info.';
        }
        if (this.end && args.date.isAfter(this.end))
            return null;
        if (args.invalidDate) {
            // To prevent getting into an infinite loop.
            // - I somewhat arbitrarily chose 50
            // - I noticed that, when limited to 10 iterations, some tests failed
            this.invalidIterationCount++;
            if (this.invalidIterationCount > 50) {
                throw new PipeError('Failed to find a single matching occurrence in 50 iterations. ' +
                    ("Last iterated date: \"" + args.date.toISOString() + "\""));
            }
        }
        else {
            if (this.previousIterationDate && this.previousIterationDate.isAfterOrEqual(args.date)) {
                console.error("Previous run's date is after or equal current run's date of \"" + args.date.toISOString() + "\". " +
                    'This is probably caused by a bug.');
                return null;
            }
            this.previousIterationDate = args.date.clone();
            this.invalidIterationCount = 0;
        }
        return args.invalidDate ? this.focusedPipe.run(__assign({}, args, { invalidDate: false })) : args.date;
    };
    return ResultPipe;
}(interfaces_1.PipeRule));
exports.ResultPipe = ResultPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMTEtcmVzdWx0LnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3BpcGVzLzExLXJlc3VsdC5waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQThEO0FBRTlEO0lBQStCLDZCQUFLO0lBQXBDOztJQUFzQyxDQUFDO0lBQUQsZ0JBQUM7QUFBRCxDQUFDLEFBQXZDLENBQStCLEtBQUssR0FBRztBQUExQiw4QkFBUztBQUV0QjtJQUEwRCw4QkFBVztJQUFyRTtRQUFBLHFFQXlDQztRQXhDUywyQkFBcUIsR0FBRyxDQUFDLENBQUE7O0lBd0NuQyxDQUFDO0lBckNDLDZFQUE2RTtJQUM3RSxvRUFBb0U7SUFDcEUsd0JBQUcsR0FBSCxVQUFJLElBQW1CO1FBQ3JCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUU7WUFDM0IsTUFBTSx3REFBd0Q7Z0JBQzVELHVDQUF1QztnQkFDdkMsMkRBQTJELENBQUE7U0FDOUQ7UUFFRCxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUFFLE9BQU8sSUFBSSxDQUFBO1FBRXhELElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQiw0Q0FBNEM7WUFDNUMsb0NBQW9DO1lBQ3BDLHFFQUFxRTtZQUNyRSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQTtZQUM1QixJQUFJLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxFQUFFLEVBQUU7Z0JBQ25DLE1BQU0sSUFBSSxTQUFTLENBQ2pCLGdFQUFnRTtxQkFDOUQsMkJBQXdCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE9BQUcsQ0FBQSxDQUNyRCxDQUFBO2FBQ0Y7U0FDRjthQUFNO1lBQ0wsSUFBSSxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3RGLE9BQU8sQ0FBQyxLQUFLLENBQ1gsbUVBQWdFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQUs7b0JBQzFGLG1DQUFtQyxDQUN0QyxDQUFBO2dCQUNELE9BQU8sSUFBSSxDQUFBO2FBQ1o7WUFFRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtZQUM5QyxJQUFJLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFBO1NBQy9CO1FBRUQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsY0FBTSxJQUFJLElBQUUsV0FBVyxFQUFFLEtBQUssSUFBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQzdGLENBQUM7SUFDSCxpQkFBQztBQUFELENBQUMsQUF6Q0QsQ0FBMEQscUJBQVEsR0F5Q2pFO0FBekNZLGdDQUFVIn0=