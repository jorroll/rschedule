"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var date_fns_1 = require("date-fns");
var Utils;
(function (Utils) {
    Utils.weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    Utils.MILLISECONDS_IN_DAY = 86400000;
    Utils.MILLISECONDS_IN_HOUR = 3600000;
    Utils.MILLISECONDS_IN_MINUTE = 60000;
    Utils.MILLISECONDS_IN_SECOND = 1000;
    function weekdayToInt(weekday, wkst) {
        if (wkst === void 0) { wkst = 'SU'; }
        var weekdays = orderedWeekdays(wkst);
        return weekdays.indexOf(weekday);
    }
    Utils.weekdayToInt = weekdayToInt;
    function orderedWeekdays(wkst) {
        if (wkst === void 0) { wkst = 'SU'; }
        var wkdays = Utils.weekdays.slice();
        var index = wkdays.indexOf(wkst);
        while (index !== 0) {
            shiftArray(wkdays);
            index--;
        }
        return wkdays;
    }
    Utils.orderedWeekdays = orderedWeekdays;
    function shiftArray(array, from) {
        if (from === void 0) { from = 'first'; }
        if (array.length === 0)
            return array;
        else if (from === 'first')
            array.push(array.shift());
        else
            array.unshift(array.pop());
        return array;
    }
    Utils.shiftArray = shiftArray;
    function sortDates(dates) {
        return dates.sort(function (a, b) {
            if (a.isAfter(b))
                return 1;
            else if (b.isAfter(a))
                return -1;
            else
                return 0;
        });
    }
    Utils.sortDates = sortDates;
    /**
     * Returns the earliest date in an array of dates. If the array is empty,
     * return `null`.
     * @param dates
     */
    function getEarliestDate(dates) {
        if (dates.length === 0)
            return null;
        else if (dates.length === 1)
            return dates[0];
        return dates.reduce(function (prev, curr) {
            if (curr.isBefore(prev))
                return curr;
            else
                return prev;
        });
    }
    Utils.getEarliestDate = getEarliestDate;
    function getDaysInMonth(month, year) {
        var block = {
            1: 31,
            2: getDaysInFebruary(year),
            3: 31,
            4: 30,
            5: 31,
            6: 30,
            7: 31,
            8: 31,
            9: 30,
            10: 31,
            11: 30,
            12: 31,
        };
        return block[month];
    }
    Utils.getDaysInMonth = getDaysInMonth;
    function getDaysInFebruary(year) {
        return isLeapYear(year) ? 29 : 28;
    }
    function isLeapYear(year) {
        return date_fns_1.isLeapYear(new Date(year, 0, 1));
    }
    Utils.isLeapYear = isLeapYear;
    function getDaysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }
    Utils.getDaysInYear = getDaysInYear;
    function setDateToStartOfYear(date) {
        return date.set('month', 1).set('day', 1);
    }
    Utils.setDateToStartOfYear = setDateToStartOfYear;
    function setDateToEndOfYear(date) {
        return date.set('month', 12).set('day', 31);
    }
    Utils.setDateToEndOfYear = setDateToEndOfYear;
    function setDateToStartOfWeek(date, wkst) {
        var index = orderedWeekdays(wkst).indexOf(date.get('weekday'));
        return date.subtract(index, 'day');
    }
    Utils.setDateToStartOfWeek = setDateToStartOfWeek;
    /**
     *
     * @param date
     * @param wkst
     * @return [numberOfWeeks, weekStartOffset]
     */
    function getWeeksInYear(date, wkst) {
        date = date.clone();
        var year = date.get('year');
        setDateToStartOfYear(date);
        var startWeekday = date.get('weekday');
        // As explained in the ICAL spec, week 53 only occurs if the year
        // falls on a specific weekday. The first element in each array is the
        // required weekday for that key on a regular year. On a leapyear, either day
        // will work.
        var keys = {
            MO: ['TH', 'WE'],
            TU: ['FR', 'TH'],
            WE: ['SA', 'FR'],
            TH: ['SU', 'SA'],
            FI: ['MO', 'SU'],
            SA: ['TU', 'MO'],
            SU: ['WE', 'TU'],
        };
        var weekStartOffset = 0;
        while (date.get('weekday') !== wkst) {
            date.add(1, 'day');
            weekStartOffset++;
        }
        var numberOfWeeks;
        if (isLeapYear(year)) {
            numberOfWeeks = keys[wkst].includes(startWeekday) ? 53 : 52;
        }
        else {
            numberOfWeeks = startWeekday === keys[wkst][0] ? 53 : 52;
        }
        // the end of the year is not necessarily the end of the last week in a year
        // setDateToEndOfYear(date)
        // const endWeekday = date.get('weekday')
        // const daysInLastWeek = orderedWeekdays(wkst).indexOf(endWeekday) + 1
        return [numberOfWeeks, weekStartOffset];
    }
    Utils.getWeeksInYear = getWeeksInYear;
    function ruleFrequencyToDateAdapterUnit(frequency) {
        switch (frequency) {
            case 'YEARLY':
                return 'year';
            case 'MONTHLY':
                return 'month';
            case 'WEEKLY':
                return 'week';
            case 'DAILY':
                return 'day';
            case 'HOURLY':
                return 'hour';
            case 'MINUTELY':
                return 'minute';
            case 'SECONDLY':
                return 'second';
        }
    }
    Utils.ruleFrequencyToDateAdapterUnit = ruleFrequencyToDateAdapterUnit;
    function dateToStandardizedString(date) {
        return "" + date.get('year') + toTwoCharString(date.get('month')) + toTwoCharString(date.get('day')) + "T" + toTwoCharString(date.get('hour')) + toTwoCharString(date.get('minute')) + toTwoCharString(date.get('second'));
    }
    Utils.dateToStandardizedString = dateToStandardizedString;
    function toTwoCharString(int) {
        if (int < 10)
            return "0" + int;
        else
            return "" + int;
    }
})(Utils = exports.Utils || (exports.Utils = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0aWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi91dGlsaXRpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxxQ0FBeUQ7QUFHekQsSUFBaUIsS0FBSyxDQStMckI7QUEvTEQsV0FBaUIsS0FBSztJQUNQLGNBQVEsR0FBK0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUVqRix5QkFBbUIsR0FBRyxRQUFRLENBQUE7SUFDOUIsMEJBQW9CLEdBQUcsT0FBTyxDQUFBO0lBQzlCLDRCQUFzQixHQUFHLEtBQUssQ0FBQTtJQUM5Qiw0QkFBc0IsR0FBRyxJQUFJLENBQUE7SUFFMUMsc0JBQ0UsT0FBNEIsRUFDNUIsSUFBZ0M7UUFBaEMscUJBQUEsRUFBQSxXQUFnQztRQUVoQyxJQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFdEMsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2xDLENBQUM7SUFQZSxrQkFBWSxlQU8zQixDQUFBO0lBRUQseUJBQTBELElBQWdDO1FBQWhDLHFCQUFBLEVBQUEsV0FBZ0M7UUFDeEYsSUFBTSxNQUFNLEdBQUcsTUFBQSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDL0IsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVoQyxPQUFPLEtBQUssS0FBSyxDQUFDLEVBQUU7WUFDbEIsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ2xCLEtBQUssRUFBRSxDQUFBO1NBQ1I7UUFFRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFWZSxxQkFBZSxrQkFVOUIsQ0FBQTtJQUVELG9CQUEyQixLQUFZLEVBQUUsSUFBZ0M7UUFBaEMscUJBQUEsRUFBQSxjQUFnQztR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