import { OccurrenceGenerator } from '@rschedule/core/generators';
import './OccurrenceGenerator';

export function parseJSON(json: OccurrenceGenerator.JSON) {
  return OccurrenceGenerator.fromJSON(json);
}
