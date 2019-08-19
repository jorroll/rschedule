import { ruleTests } from '@local-tests/rule-tests-setup';
import {
  context,
  DatetimeFn,
  environment,
  standardDatetimeFn,
  timezoneDateAdapterFn,
  TIMEZONES,
} from '@local-tests/utilities';
import {
  DateAdapter as DateAdapterConstructor,
  IProvidedRuleOptions,
  Rule,
} from '@rschedule/rschedule';
import { StandardDateAdapter } from '@rschedule/standard-date-adapter';

const DATE_ADAPTERS = [[StandardDateAdapter, standardDatetimeFn]] as [
  [typeof StandardDateAdapter, DatetimeFn<Date>]
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
