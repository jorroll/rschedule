export var DateAdapter;
(function (DateAdapter) {
    class InvalidDateError extends Error {
        constructor(message = 'DateAdapter has invalid date') {
            super(message);
            this.message = message;
        }
    }
    DateAdapter.InvalidDateError = InvalidDateError;
    let Month;
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
})(DateAdapter || (DateAdapter = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9kYXRlLWFkYXB0ZXIvZGF0ZS1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXFGQSxNQUFNLEtBQVcsV0FBVyxDQW9DM0I7QUFwQ0QsV0FBaUIsV0FBVztJQUMxQixzQkFBOEIsU0FBUSxLQUFLO1FBQ3pDLFlBQW1CLFVBQVUsOEJBQThCO1lBQ3pELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQURHLFlBQU8sR0FBUCxPQUFPLENBQWlDO1FBRTNELENBQUM7S0FDRjtJQUpZLDRCQUFnQixtQkFJNUIsQ0FBQTtJQWVELElBQVksS0FhWDtJQWJELFdBQVksS0FBSztRQUNmLCtCQUFPLENBQUE7UUFDUCwrQkFBRyxDQUFBO1FBQ0gsK0JBQUcsQ0FBQTtRQUNILCtCQUFHLENBQUE7UUFDSCwrQkFBRyxDQUFBO1FBQ0gsK0JBQUcsQ0FBQTtRQUNILCtCQUFHLENBQUE7UUFDSCwrQkFBRyxDQUFBO1FBQ0gsK0JBQUcsQ0FBQTtRQUNILGdDQUFHLENBQUE7UUFDSCxnQ0FBRyxDQUFBO1FBQ0gsZ0NBQUcsQ0FBQTtJQUNMLENBQUMsRUFiVyxLQUFLLEdBQUwsaUJBQUssS0FBTCxpQkFBSyxRQWFoQjtBQUdILENBQUMsRUFwQ2dCLFdBQVcsS0FBWCxXQUFXLFFBb0MzQiJ9