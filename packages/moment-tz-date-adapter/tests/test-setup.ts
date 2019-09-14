import { Rule } from '@rschedule/core/generators';
import { ICAL_RULES } from '@rschedule/core/rules/ICAL_RULES';
import '@rschedule/moment-tz-date-adapter/setup';

Rule.recurrenceRules = ICAL_RULES;
