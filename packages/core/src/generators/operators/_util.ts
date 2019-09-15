import { DateTime } from '@rschedule/core';
import { OccurrenceGeneratorRunResult } from '../occurrence-generator';

export class IterableWrapper {
  done!: boolean;
  value!: DateTime | undefined;

  constructor(readonly stream: OccurrenceGeneratorRunResult) {
    this.picked();
  }

  picked() {
    const { done, value } = this.stream.next();

    this.done = done;
    this.value = value;
  }

  skipToDate(date: DateTime, options: { reverse?: boolean }) {
    if (this.done) return;
    if (options.reverse ? date.isAfter(this.value!) : date.isBefore(this.value!)) return;

    const { done, value } = this.stream.next({ skipToDate: date });

    this.done = done;
    this.value = value;
  }
}

export function selectNextIterable(
  streams: IterableWrapper[],
  options: { reverse?: boolean } = {},
) {
  if (options.reverse) {
    return streams.reduce((prev, curr) => {
      if (prev.done) return curr;
      if (curr.done) return prev;

      return prev.value!.isAfter(curr.value!) ? prev : curr;
    });
  }

  return streams.reduce((prev, curr) => {
    if (prev.done) return curr;
    if (curr.done) return prev;

    return prev.value!.isBefore(curr.value!) ? prev : curr;
  });
}

export function selectLastIterable(
  streams: IterableWrapper[],
  options: { reverse?: boolean } = {},
) {
  if (options.reverse) {
    return streams.reduce((prev, curr) => {
      if (prev.done) return curr;
      if (curr.done) return prev;

      return prev.value!.isBefore(curr.value!) ? prev : curr;
    });
  }

  return streams.reduce((prev, curr) => {
    if (prev.done) return curr;
    if (curr.done) return prev;

    return prev.value!.isAfter(curr.value!) ? prev : curr;
  });
}

export function streamPastEnd(
  stream: IterableWrapper,
  options: { reverse?: boolean; start?: DateTime; end?: DateTime },
) {
  return (
    stream.done ||
    !!(options.reverse
      ? options.start && options.start.isAfter(stream.value!)
      : options.end && options.end.isBefore(stream.value!))
  );
}

export function streamPastSkipToDate(
  stream: IterableWrapper,
  skipToDate: DateTime,
  options: { reverse?: boolean },
) {
  return (
    stream.done ||
    !!(options.reverse
      ? skipToDate.isAfterOrEqual(stream.value!)
      : skipToDate.isBeforeOrEqual(stream.value!))
  );
}
