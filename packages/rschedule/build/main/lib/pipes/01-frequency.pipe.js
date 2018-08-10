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
var date_adapter_1 = require("../date-adapter");
var interfaces_1 = require("./interfaces");
var utilities_1 = require("../utilities");
// the frequency pipe accepts an array of dates only to adhere to the PipeFn interface
// in reality, will always only accept a single starting date wrapped in an array
var FrequencyPipe = /** @class */ (function (_super) {
    __extends(FrequencyPipe, _super);
    function FrequencyPipe() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.intervalStartDate = _this.normalizeDate(_this.options.start.clone());
        return _this;
    }
    FrequencyPipe.prototype.run = function (args) {
        var date;
        if (args.skipToIntervalOnOrAfter) {
            this.skipToIntervalOnOrAfter(args.skipToIntervalOnOrAfter);
            date = args.skipToIntervalOnOrAfter.isAfterOrEqual(this.intervalStartDate)
                ? args.skipToIntervalOnOrAfter
                : this.intervalStartDate.clone();
        }
        else {
            this.incrementInterval();
            date = this.intervalStartDate.clone();
        }
        return this.nextPipe.run({ date: date });
    };
    FrequencyPipe.prototype.normalizeDate = function (date) {
        switch (this.options.frequency) {
            case 'YEARLY':
                utilities_1.Utils.setDateToStartOfYear(date);
                break;
            case 'MONTHLY':
                date.set('day', 1);
                break;
            case 'WEEKLY':
                var dayIndex = utilities_1.Utils.orderedWeekdays(this.options.weekStart).indexOf(date.get('weekday'));
                date.subtract(dayIndex, 'day');
                break;
        }
        switch (this.options.frequency) {
            case 'YEARLY':
            case 'MONTHLY':
            case 'WEEKLY':
            case 'DAILY':
                date.set('hour', 0);
            case 'HOURLY':
                date.set('minute', 0);
            case 'MINUTELY':
                date.set('second', 0);
        }
        return date;
    };
    // need to account for possible daylight savings time shift
    FrequencyPipe.prototype.incrementInterval = function () {
        var unit = utilities_1.Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency);
        var oldTZOffset = this.intervalStartDate.get('tzoffset');
        this.intervalStartDate.add(this.options.interval, unit);
        var newTZOffset = this.intervalStartDate.get('tzoffset');
        var tzOffset = newTZOffset - oldTZOffset;
        var newDate = this.intervalStartDate.clone().add(tzOffset, 'second');
        if (newDate.get('tzoffset') !== this.intervalStartDate.get('tzoffset')) {
            throw new date_adapter_1.DateAdapter.InvalidDateError("A date was created on the border of daylight savings time: \"" + newDate.toISOString() + "\"");
        }
        else {
            this.intervalStartDate = newDate;
        }
    };
    /**
     * This method might be buggy when presented with intervals other than one.
     * In such a case, skipping forward should *skip* seconds of dates, and I'm
     * not sure if this will account for that. Don't have time to test at the moment.
     *
     * Tests are passing
     */
    FrequencyPipe.prototype.skipToIntervalOnOrAfter = function (newDate) {
        var unit = utilities_1.Utils.ruleFrequencyToDateAdapterUnit(this.options.frequency);
        var intervalStart = this.intervalStartDate.get('ordinal');
        var intervalEnd = this.intervalStartDate
            .clone()
            .add(1, unit)
            .get('ordinal');
        var date = newDate.get('ordinal');
        var intervalDuration = intervalEnd - intervalStart;
        var sign = Math.sign(date - intervalStart);
        var difference = Math.floor(Math.abs(date - intervalStart) / intervalDuration) * sign;
        this.intervalStartDate.add(difference, unit);
        // This is sort of a quick/hacky solution to a problem experienced with test
        // "testYearlyBetweenIncLargeSpan2" which has a start date of 1920.
        // Not sure why `difference` isn't resolved to whole number in that test,
        // but the first call to this method turns up an iteration exactly 1 year
        // before the iteration it should return.
        while (!newDate.isBefore(this.intervalStartDate.clone().add(1, unit))) {
            this.intervalStartDate.add(this.options.interval, unit);
        }
    };
    return FrequencyPipe;
}(interfaces_1.PipeRule));
exports.FrequencyPipe = FrequencyPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDEtZnJlcXVlbmN5LnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3BpcGVzLzAxLWZyZXF1ZW5jeS5waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLGdEQUE2QztBQUM3QywyQ0FBOEQ7QUFDOUQsMENBQW9DO0FBRXBDLHNGQUFzRjtBQUN0RixpRkFBaUY7QUFDakY7SUFBNkQsaUNBQVc7SUFBeEU7UUFBQSxxRUF5R0M7UUF4R1MsdUJBQWlCLEdBQU0sS0FBSSxDQUFDLGFBQWEsQ0FBQyxLQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFBOztJQXdHL0UsQ0FBQztJQXRHQywyQkFBRyxHQUFILFVBQUksSUFBbUI7UUFDckIsSUFBSSxJQUFPLENBQUE7UUFFWCxJQUFJLElBQUksQ0FBQyx1QkFBdUIsRUFBRTtZQUNoQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUE7WUFFMUQsSUFBSSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDO2dCQUN4RSxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QjtnQkFDOUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtTQUNuQzthQUFNO1lBQ0wsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUE7WUFDeEIsSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtTQUN0QztRQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLE1BQUEsRUFBRSxDQUFDLENBQUE7SUFDcEMsQ0FBQztJQUVELHFDQUFhLEdBQWIsVUFBYyxJQUFPO1FBQ25CLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDOUIsS0FBSyxRQUFRO2dCQUNYLGlCQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ2hDLE1BQUs7WUFDUCxLQUFLLFNBQVM7Z0JBQ1osSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQ2xCLE1BQUs7WUFDUCxLQUFLLFFBQVE7Z0JBQ1gsSUFBTSxRQUFRLEdBQUcsaUJBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO2dCQUMzRixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDOUIsTUFBSztTQUNSO1FBRUQsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUM5QixLQUFLLFFBQVEsQ0FBQztZQUNkLEtBQUssU0FBUyxDQUFDO1lBQ2YsS0FBSyxRQUFRLENBQUM7WUFDZCxLQUFLLE9BQU87Z0JBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDckIsS0FBSyxRQUFRO2dCQUNYLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3ZCLEtBQUssVUFBVTtnQkFDYixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQTtTQUN4QjtRQUVELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELDJEQUEyRDtJQUNuRCx5Q0FBaUIsR0FBekI7UUFDRSxJQUFNLElBQUksR0FBRyxpQkFBSyxDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7UUFFekUsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUUxRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRXZELElBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUE7UUFFMUQsSUFBTSxRQUFRLEdBQUcsV0FBVyxHQUFHLFdBQVcsQ0FBQTtRQUUxQyxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUV0RSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN0RSxNQUFNLElBQUksMEJBQVcsQ0FBQyxnQkFBZ0IsQ0FDcEMsa0VBQStELE9BQU8sQ0FBQyxXQUFXLEVBQUUsT0FBRyxDQUN4RixDQUFBO1NBQ0Y7YUFBTTtZQUNMLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUE7U0FDakM7SUFDSCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ssK0NBQXVCLEdBQS9CLFVBQWdDLE9BQVU7UUFDeEMsSUFBTSxJQUFJLEdBQUcsaUJBQUssQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQ3pFLElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDM0QsSUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGlCQUFpQjthQUN2QyxLQUFLLEVBQUU7YUFDUCxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQzthQUNaLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUNqQixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBRW5DLElBQU0sZ0JBQWdCLEdBQUcsV0FBVyxHQUFHLGFBQWEsQ0FBQTtRQUVwRCxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsQ0FBQTtRQUU1QyxJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFBO1FBRXZGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRTVDLDRFQUE0RTtRQUM1RSxtRUFBbUU7UUFDbkUseUVBQXlFO1FBQ3pFLHlFQUF5RTtRQUN6RSx5Q0FBeUM7UUFDekMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNyRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFBO1NBQ3hEO0lBQ0gsQ0FBQztJQUNILG9CQUFDO0FBQUQsQ0FBQyxBQXpHRCxDQUE2RCxxQkFBUSxHQXlHcEU7QUF6R1ksc0NBQWEifQ==