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
Object.defineProperty(exports, "__esModule", { value: true });
var DateAdapter;
(function (DateAdapter) {
    var InvalidDateError = /** @class */ (function (_super) {
        __extends(InvalidDateError, _super);
        function InvalidDateError(message) {
            if (message === void 0) { message = 'DateAdapter has invalid date'; }
            var _this = _super.call(this, message) || this;
            _this.message = message;
            return _this;
        }
        return InvalidDateError;
    }(Error));
    DateAdapter.InvalidDateError = InvalidDateError;
    var Month;
    (function (Month) {
        Month[Month["JAN"] = 1] = "JAN";
        Month[Month["FEB"] = 2] = "FEB";
        Month[Month["MAR"] = 3] = "MAR";
        Month[Month["APR"] = 4] = "APR";
        Month[Month["MAY"] = 5] = "MAY";
        Month[Month["JUN"] = 6] = "JUN";
        Month[Month["JUL"] = 7] = "JUL";
        Month[Month["AUG"] = 8] = "AUG";
        Month[Month["SEP"] = 9] = "SEP";
        Month[Month["OCT"] = 10] = "OCT";
        Month[Month["NOV"] = 11] = "NOV";
        Month[Month["DEC"] = 12] = "DEC";
    })(Month = DateAdapter.Month || (DateAdapter.Month = {}));
})(DateAdapter = exports.DateAdapter || (exports.DateAdapter = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9kYXRlLWFkYXB0ZXIvZGF0ZS1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQXFGQSxJQUFpQixXQUFXLENBb0MzQjtBQXBDRCxXQUFpQixXQUFXO0lBQzFCO1FBQXNDLG9DQUFLO1FBQ3pDLDBCQUFtQixPQUF3QztZQUF4Qyx3QkFBQSxFQUFBLHdDQUF3QztZQUEzRCxZQUNFLGtCQUFNLE9BQU8sQ0FBQyxTQUNmO1lBRmtCLGFBQU8sR0FBUCxPQUFPLENBQWlDOztRQUUzRCxDQUFDO1FBQ0gsdUJBQUM7SUFBRCxDQUFDLEFBSkQsQ0FBc0MsS0FBSyxHQUkxQztJQUpZLDRCQUFnQixtQkFJNUIsQ0FBQTtJQWVELElBQVksS0FhWDtJQWJELFdBQVksS0FBSztRQUNmLCtCQUFPLENBQUE7UUFDUCwrQkFBRyxDQUFBO1FBQ0gsK0JBQUcsQ0FBQTtRQUNILCtCQUFHLENBQUE7UUFDSCwrQkFBRyxDQUFBO1FBQ0gsK0JBQUcsQ0FBQTtRQUNILCtCQUFHLENBQUE7UUFDSCwrQkFBRyxDQUFBO1FBQ0gsK0JBQUcsQ0FBQTtRQUNILGdDQUFHLENBQUE7UUFDSCxnQ0FBRyxDQUFBO1FBQ0gsZ0NBQUcsQ0FBQTtJQUNMLENBQUMsRUFiVyxLQUFLLEdBQUwsaUJBQUssS0FBTCxpQkFBSyxRQWFoQjtBQUdILENBQUMsRUFwQ2dCLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBb0MzQiJ9