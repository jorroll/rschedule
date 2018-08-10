import { DateAdapter } from '../date-adapter';
/**
 * This function performs validation checks on the provided rule options and retuns
 * a cloned validated options object.
 */
export declare function buildValidatedRuleOptions<T extends DateAdapter<T>>(options: Options.ProvidedOptions<T>): Options.ProcessedOptions<T>;
export declare namespace Options {
    type Frequency = 'SECONDLY' | 'MINUTELY' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    type ByDayOfWeek = DateAdapter.Weekday | [DateAdapter.Weekday, number];
    interface ProvidedOptions<T extends DateAdapter<T>> {
        start: T;
        frequency: Frequency;
        interval?: number;
        bySecondOfMinute?: BySecondOfMinute[];
        byMinuteOfHour?: ByMinuteOfHour[];
        byHourOfDay?: ByHourOfDay[];
        byDayOfWeek?: ByDayOfWeek[];
        byDayOfMonth?: ByDayOfMonth[];
        byMonthOfYear?: ByMonthOfYear[];
        until?: T;
        count?: number;
        weekStart?: DateAdapter.Weekday;
    }
    interface ProcessedOptions<T extends DateAdapter<T>> extends ProvidedOptions<T> {
        interval: number;
        weekStart: DateAdapter.Weekday;
    }
    type BySecondOfMinute = ByMinuteOfHour | 60;
    type ByMonthOfYear = DateAdapter.IMonth;
    type ByMinuteOfHour = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59;
    type ByHourOfDay = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;
    type ByDayOfMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | -1 | -2 | -3 | -4 | -5 | -6 | -7 | -8 | -9 | -10 | -11 | -12 | -13 | -14 | -15 | -16 | -17 | -18 | -19 | -20 | -21 | -22 | -23 | -24 | -25 | -26 | -27 | -28 | -29 | -30 | -31;
    type ByWeekOfMonth = 1 | 2 | 3 | 4 | 5 | -1 | -2 | -3 | -4;
}
