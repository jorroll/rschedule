import { DateAdapter } from './date-adapter';
import { Options } from './rule';
export declare namespace Utils {
    const weekdays: Array<DateAdapter.Weekday>;
    const MILLISECONDS_IN_DAY = 86400000;
    const MILLISECONDS_IN_HOUR = 3600000;
    const MILLISECONDS_IN_MINUTE = 60000;
    const MILLISECONDS_IN_SECOND = 1000;
    function weekdayToInt<T extends DateAdapter<T>>(weekday: DateAdapter.Weekday, wkst?: DateAdapter.Weekday): number;
    function orderedWeekdays<T extends DateAdapter<T>>(wkst?: DateAdapter.Weekday): DateAdapter.Weekday[];
    function shiftArray(array: any[], from?: 'first' | 'last'): any[];
    function sortDates<T extends DateAdapter<T>>(dates: T[]): T[];
    /**
     * Returns the earliest date in an array of dates. If the array is empty,
     * return `null`.
     * @param dates
     */
    function getEarliestDate<T extends DateAdapter<T>>(dates: T[]): T | null;
    function getDaysInMonth(month: number, year: number): number;
    function isLeapYear(year: number): boolean;
    function getDaysInYear(year: number): 366 | 365;
    function setDateToStartOfYear<T extends DateAdapter<T>>(date: T): T;
    function setDateToEndOfYear<T extends DateAdapter<T>>(date: T): T;
    function setDateToStartOfWeek<T extends DateAdapter<T>>(date: T, wkst: DateAdapter.Weekday): T;
    /**
     *
     * @param date
     * @param wkst
     * @return [numberOfWeeks, weekStartOffset]
     */
    function getWeeksInYear<T extends DateAdapter<T>>(date: T, wkst: DateAdapter.Weekday): [number, number];
    function ruleFrequencyToDateAdapterUnit(frequency: Options.Frequency): "day" | "hour" | "minute" | "month" | "second" | "year" | "week";
    function dateToStandardizedString<T extends DateAdapter<T>>(date: T): string;
}
