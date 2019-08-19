import { ruleTests } from '@local-tests/rule-tests-setup';
import {
  context,
  DatetimeFn,
  environment,
  momentDatetimeFn,
  timezoneDateAdapterFn,
  TIMEZONES,
} from '@local-tests/utilities';
import { MomentDateAdapter } from '@rschedule/moment-date-adapter';
import {
  DateAdapter as DateAdapterConstructor,
  IProvidedRuleOptions,
  Rule,
} from '@rschedule/rschedule';
import { Moment as MomentST } from 'moment';

const DATE_ADAPTERS = [[MomentDateAdapter, momentDatetimeFn]] as [
  [typeof MomentDateAdapter, DatetimeFn<MomentST>]
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

        describe('Rule', () => {
          function buildGenerator(config: IProvidedRuleOptions<any>) {
            return new Rule(config, { dateAdapter: DateAdapter, timezone });
          }

          ruleTests(DateAdapter, dateAdapter, parse, buildGenerator);
        });
      });
    });
  });
});
