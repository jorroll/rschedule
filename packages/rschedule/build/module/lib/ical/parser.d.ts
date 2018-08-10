import { DateAdapter, DateAdapterConstructor, IDateAdapterConstructor } from '../date-adapter';
import { Options } from '../rule/rule-options';
export declare class ICalStringParseError extends Error {
}
/**
 * Parses an array of ICAL strings and returns an object containing
 * `rrules`, `exrules`, `rdates`, and `exdates`. The `rrules` and `exrules`
 * properties contain `ProvidedOptions` objects and the `rdates` and `exdates`
 * properties contain `DateAdapter` objects built with a `DateAdapter`
 * constructor you provide. `parseICalStrings` will use the date adapter constructor's
 * `fromTimeObject` static method to instantiate new instances.
 *
 * @param icalStrings
 * @param dateAdapterConstructor
 */
export declare function parseICalStrings<T extends DateAdapterConstructor<T>, K extends DateAdapter<InstanceType<T>> = InstanceType<T>>(icalStrings: string[], dateAdapterConstructor: IDateAdapterConstructor<T>): {
    rrules: Options.ProvidedOptions<K>[];
    rdates: K[];
    exdates: K[];
};
/**
 * This function accepts the DTSTART portion of an ICAL string
 * and returns an object containing the `time`, broken up into an array
 * of `[YYYY, MM, DD, HH, MM, SS]`, the `timezone`, if applicable, and
 * the `raw` DTSTART text.
 *
 * If it encounters a parsing error, a `ICalStringParseError` will be thrown.
 *
 * @param text The DTSTART portion of an ICAL string
 */
export declare function parseDTStart(text?: string): {
    datetimes: [number, number, number, number | undefined, number | undefined, number | undefined][];
    timezone: string | undefined;
    raw: string;
};
/**
 * This function parses an ICAL time string, throwing a `ICalStringParseError`
 * if it runs into problems, and returns an object with three properties:
 *
 * 1. `datetimes`: an array of parsed time values each in
 *   `[YYYY, MM, DD, HH, MM, SS]` format, where `HH`, `MM`, and `SS`
 *   may be `undefined`.
 * 2. `timezone`: the timezone all of the datetimes are in.
 *   - If local timezone: `undefined`
 *   - If UTC timezone: `"UTC"`
 *   - If the datetime is a DATE: `"DATE"`
 *   - Else: contains the ICAL formatted timezone (e.g. `"America/New_York"`)
 * 3. `raw`: The raw ICAL time string
 *
 * @param text the raw ICAL time text
 */
export declare function parseDatetime(text: string): {
    datetimes: [number, number, number, number | undefined, number | undefined, number | undefined][];
    timezone: string | undefined;
    raw: string;
};
export declare function parseFrequency(text: string): string;
export declare function parseUntil<T extends DateAdapterConstructor<T>>(text: string, dateAdapterConstructor: IDateAdapterConstructor<T>, start: InstanceType<T>): InstanceType<T>;
export declare function parseCount(text: string): number;
export declare function parseInterval(text: string): number;
export declare function parseBySecond(text: string): number[];
export declare function parseByMinute(text: string): number[];
export declare function parseByHour(text: string): number[];
export declare function parseByDay(text: string): Options.ByDayOfWeek[];
export declare function parseByMonthDay(text: string): number[];
export declare function parseByMonth(text: string): number[];
export declare function parseWkst(text: string): string;
