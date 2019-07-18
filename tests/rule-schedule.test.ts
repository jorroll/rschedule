/**
 * Credit:
 * The vast majority of these tests were taken from [rrulejs](https://github.com/jakubroztocil/rrule),
 * which itself credits the python library `dateutil.rrule` for first creating the tests.
 */

import { LuxonDateAdapter } from '@rschedule/luxon-date-adapter';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import { MomentTZDateAdapter } from '@rschedule/moment-tz-date-adapter';
import {
  DateAdapter as DateAdapterConstructor,
  IProvidedRuleOptions,
  Schedule,
} from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';
import { DateTime as LuxonDateTime } from 'luxon';
import { Moment as MomentST } from 'moment';
import { Moment as MomentTZ } from 'moment-timezone';
import { ruleTests } from './rule-tests-setup';
import {
  context,
  DatetimeFn,
  environment,
  luxonDatetimeFn,
  momentDatetimeFn,
  momentTZDatetimeFn,
  standardDatetimeFn,
  timezoneDateAdapterFn,
  TIMEZONES,
} from './utilities';

const DATE_ADAPTERS = [
  [StandardDateAdapter, standardDatetimeFn],
  [MomentDateAdapter, momentDatetimeFn],
  [MomentTZDateAdapter, momentTZDatetimeFn],
  [LuxonDateAdapter, luxonDatetimeFn],
] as [
  [typeof StandardDateAdapter, DatetimeFn<Date>],
  [typeof MomentDateAdapter, DatetimeFn<MomentST>],
  [typeof MomentTZDateAdapter, DatetimeFn<MomentTZ>],
  [typeof LuxonDateAdapter, DatetimeFn<LuxonDateTime>]
];

DATE_ADAPTERS.forEach(dateAdapterSet => {
  environment(dateAdapterSet, dateAdapterSet => {
    const [DateAdapter, datetime] = dateAdapterSet as [
      typeof DateAdapterConstructor,
      DatetimeFn<any>
    ];

    // const timezones = !DateAdapter.hasTimezoneSupport ? ['UTC'] : ['UTC'];
    const timezones = !DateAdapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

    timezones.forEach(timezone => {
      context(timezone, zone => {
        const dateAdapter = timezoneDateAdapterFn(DateAdapter, datetime, zone);

        // legacy function to create new dateAdapter instances
        const parse = (str: string) => {
          const parts: Array<number | string> = str
            .match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)!
            .map(part => Number(part));

          parts.shift();

          // @ts-ignore
          return dateAdapter(...parts);
        };

        describe('Schedule', () => {
          const buildGenerator = (config: IProvidedRuleOptions<any>) =>
            new Schedule({
              rrules: [config],
              dateAdapter: DateAdapter,
              timezone,
            });

          ruleTests(DateAdapter, dateAdapter, parse, buildGenerator);
        });
      });
    });
  });
});
