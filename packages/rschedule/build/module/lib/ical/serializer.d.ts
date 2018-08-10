import { DateAdapter } from '../date-adapter';
import { Options } from '../rule/rule-options';
export declare class ICalStringSerialzeError extends Error {
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
export declare function ruleOptionsToIcalString<T extends DateAdapter<T>>(options: Options.ProvidedOptions<T>, type?: 'RRULE' | 'EXRULE'): string;
/**
 * Converts an array of dates into an ICAL string containing RDATEs.
 * All dates must be in the same timezone.
 *
 * @param dates array of DateAdapter dates
 * @param type whether these are RDATEs or EXDATEs
 */
export declare function datesToIcalString<T extends DateAdapter<T>>(dates: T[], type?: 'RDATE' | 'EXDATE'): string;
export declare function dateAdapterToICal<T extends DateAdapter<T>>(date: T, utc?: boolean): string;
