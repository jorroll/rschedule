import { isLeapYear as dateFnIsLeapYear } from 'date-fns';
export var Utils;
(function (Utils) {
    Utils.weekdays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    Utils.MILLISECONDS_IN_DAY = 86400000;
    Utils.MILLISECONDS_IN_HOUR = 3600000;
    Utils.MILLISECONDS_IN_MINUTE = 60000;
    Utils.MILLISECONDS_IN_SECOND = 1000;
    function weekdayToInt(weekday, wkst = 'SU') {
        const weekdays = orderedWeekdays(wkst);
        return weekdays.indexOf(weekday);
    }
    Utils.weekdayToInt = weekdayToInt;
    function orderedWeekdays(wkst = 'SU') {
        const wkdays = Utils.weekdays.slice();
        let index = wkdays.indexOf(wkst);
        while (index !== 0) {
            shiftArray(wkdays);
            index--;
        }
        return wkdays;
    }
    Utils.orderedWeekdays = orderedWeekdays;
    function shiftArray(array, from = 'first') {
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
        return dates.sort((a, b) => {
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
        return dates.reduce((prev, curr) => {
            if (curr.isBefore(prev))
                return curr;
            else
                return prev;
        });
    }
    Utils.getEarliestDate = getEarliestDate;
    function getDaysInMonth(month, year) {
        const block = {
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
        return dateFnIsLeapYear(new Date(year, 0, 1));
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
        const index = orderedWeekdays(wkst).indexOf(date.get('weekday'));
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
        const year = date.get('year');
        setDateToStartOfYear(date);
        const startWeekday = date.get('weekday');
        // As explained in the ICAL spec, week 53 only occurs if the year
        // falls on a specific weekday. The first element in each array is the
        // required weekday for that key on a regular year. On a leapyear, either day
        // will work.
        const keys = {
            MO: ['TH', 'WE'],
            TU: ['FR', 'TH'],
            WE: ['SA', 'FR'],
            TH: ['SU', 'SA'],
            FI: ['MO', 'SU'],
            SA: ['TU', 'MO'],
            SU: ['WE', 'TU'],
        };
        let weekStartOffset = 0;
        while (date.get('weekday') !== wkst) {
            date.add(1, 'day');
            weekStartOffset++;
        }
        let numberOfWeeks;
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
        return `${date.get('year')}${toTwoCharString(date.get('month'))}${toTwoCharString(date.get('day'))}T${toTwoCharString(date.get('hour'))}${toTwoCharString(date.get('minute'))}${toTwoCharString(date.get('second'))}`;
    }
    Utils.dateToStandardizedString = dateToStandardizedString;
    function toTwoCharString(int) {
        if (int < 10)
            return `0${int}`;
        else
            return `${int}`;
    }
})(Utils || (Utils = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0aWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi91dGlsaXRpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFVBQVUsSUFBSSxnQkFBZ0IsRUFBRSxNQUFNLFVBQVUsQ0FBQTtBQUd6RCxNQUFNLEtBQVcsS0FBSyxDQStMckI7QUEvTEQsV0FBaUIsS0FBSztJQUNQLGNBQVEsR0FBK0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUVqRix5QkFBbUIsR0FBRyxRQUFRLENBQUE7SUFDOUIsMEJBQW9CLEdBQUcsT0FBTyxDQUFBO0lBQzlCLDRCQUFzQixHQUFHLEtBQUssQ0FBQTtJQUM5Qiw0QkFBc0IsR0FBRyxJQUFJLENBQUE7SUFFMUMsc0JBQ0UsT0FBNEIsRUFDNUIsT0FBNEIsSUFBSTtRQUVoQyxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFdEMsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ2xDLENBQUM7SUFQZSxrQkFBWSxlQU8zQixDQUFBO0lBRUQseUJBQTBELE9BQTRCLElBQUk7UUFDeEYsTUFBTSxNQUFNLEdBQUcsTUFBQSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDL0IsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVoQyxPQUFPLEtBQUssS0FBSyxDQUFDLEVBQUU7WUFDbEIsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ2xCLEtBQUssRUFBRSxDQUFBO1NBQ1I7UUFFRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFWZSxxQkFBZSxrQkFVOUIsQ0FBQTtJQUVELG9CQUEyQixLQUFZLEVBQUUsT0FBeUIsT0FBTztRQUN2RSxJQUFJLEtB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