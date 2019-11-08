import {
  cloneRuleOptions,
  DateTime,
  INormRuleOptions,
  IRecurrenceRuleModule,
  IRuleOptions,
} from '@rschedule/core';

import { IRuleArgs, RuleBase } from './rule-base';

export class Rule<Data = any> extends RuleBase<IRuleOptions, INormRuleOptions, Data> {
  static recurrenceRules: readonly IRecurrenceRuleModule<any, any>[] = [];

  /**
   * Create a new Rule object with the specified rule config and options.
   *
   * ### Options
   *
   * - **timezone**: the timezone that yielded occurrences should be in. Note,
   *   this does not change the rule config. Occurrences are first found using
   *   the unmodified rule config, and then converted to the timezone specified
   *   here before being yielded.
   * - **data**: arbitrary data you can associate with this rule. This
   *   is the only mutable property of `Rule` objects.
   *
   * ### Rule Config
   *
   * - #### frequency
   *
   *   The frequency rule part identifies the type of recurrence rule. Valid values
   *   include `"SECONDLY"`, `"MINUTELY"`, `"HOURLY"`, `"DAILY"`, `"WEEKLY"`,
   *   `"MONTHLY"`, or `"YEARLY"`.
   *
   * - #### start
   *
   *   The start of the rule (not necessarily the first occurrence).
   *   Either a `DateAdapter` instance, date object, or `DateTime` object.
   *   The type of date object depends on the `DateAdapter` class used for this
   *   `Rule`.
   *
   * - #### end?
   *
   *   The end of the rule (not necessarily the last occurrence).
   *   Either a `DateAdapter` instance, date object, or `DateTime` object.
   *   The type of date object depends on the `DateAdapter` class used for this
   *   `Rule`.
   *
   * - #### duration?
   *
   *   A length of time expressed in milliseconds.
   *
   * - #### interval?
   *
   *   The interval rule part contains a positive integer representing at
   *   which intervals the recurrence rule repeats. The default value is
   *   `1`, meaning every second for a SECONDLY rule, every minute for a
   *   MINUTELY rule, every hour for an HOURLY rule, every day for a
   *   DAILY rule, every week for a WEEKLY rule, every month for a
   *   MONTHLY rule, and every year for a YEARLY rule. For example,
   *   within a DAILY rule, a value of `8` means every eight days.
   *
   * - #### count?
   *
   *   The count rule part defines the number of occurrences at which to
   *   range-bound the recurrence. `count` and `end` are both two different
   *   ways of specifying how a recurrence completes.
   *
   * - #### weekStart?
   *
   *   The weekStart rule part specifies the day on which the workweek starts.
   *   Valid values are `"MO"`, `"TU"`, `"WE"`, `"TH"`, `"FR"`, `"SA"`, and `"SU"`.
   *   This is significant when a WEEKLY rule has an interval greater than 1,
   *   and a `byDayOfWeek` rule part is specified. The
   *   default value is `"MO"`.
   *
   * - #### bySecondOfMinute?
   *
   *   The bySecondOfMinute rule part expects an array of seconds
   *   within a minute. Valid values are 0 to 60.
   *
   * - #### byMinuteOfHour?
   *
   *   The byMinuteOfHour rule part expects an array of minutes within an hour.
   *   Valid values are 0 to 59.
   *
   * - #### byHourOfDay?
   *
   *   The byHourOfDay rule part expects an array of hours of the day.
   *   Valid values are 0 to 23.
   *
   * - #### byDayOfWeek?
   *
   *   *note: the byDayOfWeek rule part is kinda complex. Blame the ICAL spec.*
   *
   *   The byDayOfWeek rule part expects an array. Each array entry can
   *   be a day of the week (`"SU"`, `"MO"` , `"TU"`, `"WE"`, `"TH"`,
   *   `"FR"`, `"SA"`). If the rule's `frequency` is either MONTHLY or YEARLY,
   *   Any entry can also be a tuple where the first value of the tuple is a
   *   day of the week and the second value is an positive/negative integer
   *   (e.g. `["SU", 1]`). In this case, the number indicates the nth occurrence of
   *   the specified day within the MONTHLY or YEARLY rule.
   *
   *   The behavior of byDayOfWeek changes depending on the `frequency`
   *   of the rule.
   *
   *   Within a MONTHLY rule, `["MO", 1]` represents the first Monday
   *   within the month, whereas `["MO", -1]` represents the last Monday
   *   of the month.
   *
   *   Within a YEARLY rule, the numeric value in a byDayOfWeek tuple entry
   *   corresponds to an offset within the month when the byMonthOfYear rule part is
   *   present, and corresponds to an offset within the year otherwise.
   *
   *   Regardless of rule `frequency`, if a byDayOfWeek entry is a string
   *   (rather than a tuple), it means "all of these days" within the specified
   *   frequency (e.g. within a MONTHLY rule, `"MO"` represents all Mondays within
   *   the month).
   *
   * - #### byDayOfMonth?
   *
   *   The byDayOfMonth rule part expects an array of days
   *   of the month. Valid values are 1 to 31 or -31 to -1.
   *
   *   For example, -10 represents the tenth to the last day of the month.
   *   The byDayOfMonth rule part *must not* be specified when the rule's
   *   `frequency` is set to WEEKLY.
   *
   * - #### byMonthOfYear?
   *
   *   The byMonthOfYear rule part expects an array of months
   *   of the year. Valid values are 1 to 12.
   *
   */
  constructor(config: IRuleOptions, options: IRuleArgs<Data> = {}) {
    super(Rule.recurrenceRules, config, options);
  }

  /**
   * Rule's are immutable. This allows you to create a new Rule with an updated timezone
   * or rule option.
   *
   * ### Important!
   * When updating the rule's timezone, this does not change the *options* associated with this
   * `Rule`, so the rule is still processed using whatever timezone is
   * associated with the rule's `start` time. When the rule is run, and
   * a date is found to be valid, that date is only then converted to
   * the timezone you specify here and returned to you. If you wish
   * to update the timezone associated with the rule options, change the rule's
   * `start` time.
   */
  set(prop: 'timezone', value: string | null, tzoptions?: { keepLocalTime?: boolean }): Rule<Data>;
  set(prop: 'options', value: IRuleOptions): Rule<Data>;
  set<Prop extends keyof IRuleOptions>(prop: Prop, value: IRuleOptions[Prop]): Rule<Data>;
  set<Prop extends keyof IRuleOptions | 'timezone' | 'options'>(
    prop: Prop,
    value: IRuleOptions[Exclude<Prop, 'timezone' | 'options'>] | string | null,
    tzoptions: { keepLocalTime?: boolean } = {},
  ) {
    let options = cloneRuleOptions(this.options);
    let timezone = this.timezone;

    if (prop === 'timezone') {
      if (value === this.timezone && !tzoptions.keepLocalTime) return this;
      else if (tzoptions.keepLocalTime) {
        const json = this.normalizeDateInput(options.start).toJSON();
        json.timezone = value as string | null;
        const adapter = this.dateAdapter.fromJSON(json);

        // prettier-ignore
        options.start =
          options.start instanceof this.dateAdapter ? adapter :
          options.start instanceof DateTime ? adapter.toDateTime() :
          adapter.date;
      }

      timezone = value as string | null;
    } else if (prop === 'options') {
      options = (value as any) as IRuleOptions;
    } else {
      options[prop as Exclude<Prop, 'timezone' | 'options'>] = value as IRuleOptions[Exclude<
        Prop,
        'timezone' | 'options'
      >];
    }

    return new Rule(options, {
      data: this.data,
      maxDuration: this.maxDuration,
      timezone,
    });
  }
}
