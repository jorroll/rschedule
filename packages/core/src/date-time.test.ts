import { DateTime } from '@rschedule/core';

/**
 * ### DateTime tests
 *
 */

function dateTime(...args: Array<number | string>) {
  if (args.length === 0) {
    const date = new Date();

    return DateTime.fromJSON({
      timezone: 'UTC',
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
      millisecond: date.getUTCMilliseconds(),
    });
  }

  return DateTime.fromJSON({
    timezone: 'UTC',
    year: args[0] as number,
    month: (args[1] || 1) as number,
    day: (args[2] || 1) as number,
    hour: (args[3] || 0) as number,
    minute: (args[4] || 0) as number,
    second: (args[5] || 0) as number,
    millisecond: (args[6] || 0) as number,
  });
}

function isoString(...args: any[]) {
  if (args.length > 1) {
    args[1] = args[1] - 1;
  }

  return new Date(Date.UTC(...(args as [number, number, number]))).toISOString();
}

describe(`DateTimeClass`, () => {
  it('new()', () => {
    expect(dateTime()).toBeInstanceOf(DateTime);
  });

  describe('fromJSON()', () => {
    it('UTC', () => {
      const datetime = DateTime.fromJSON({
        timezone: 'UTC',
        year: 1970,
        month: 1,
        day: 1,
        hour: 1,
        minute: 1,
        second: 1,
        millisecond: 1,
      });

      expect(datetime.toISOString()).toBe('1970-01-01T01:01:01.001Z');

      expect(datetime.toJSON()).toEqual({
        timezone: 'UTC',
        year: 1970,
        month: 1,
        day: 1,
        hour: 1,
        minute: 1,
        second: 1,
        millisecond: 1,
      });
    });

    it('local', () => {
      const datetime = DateTime.fromJSON({
        timezone: null,
        year: 1970,
        month: 1,
        day: 1,
        hour: 1,
        minute: 1,
        second: 1,
        millisecond: 1,
      });

      expect(datetime.toISOString()).toBe('1970-01-01T01:01:01.001Z');

      expect(datetime.toJSON()).toEqual({
        timezone: null,
        year: 1970,
        month: 1,
        day: 1,
        hour: 1,
        minute: 1,
        second: 1,
        millisecond: 1,
      });
    });
  });
});

describe('DateTime', () => {
  const adapter = dateTime(1970, 1, 1, 1, 1, 1, 1);
  const date = new Date(Date.UTC(1970, 0, 1, 1, 1, 1, 1));

  it('isEqual()', () => {
    expect(adapter.isEqual(adapter)).toBeTruthy();
    expect(adapter.isEqual(dateTime(1970, 1, 1, 1, 1, 1, 1))).toBeTruthy();
    expect(adapter.isEqual(dateTime())).toBeFalsy();
  });

  it('isBefore()', () => {
    expect(adapter.isBefore(adapter)).toBeFalsy();
    expect(adapter.isBefore(dateTime(1969, 1, 1))).toBeFalsy();
    expect(adapter.isBefore(dateTime(1971, 1, 1))).toBeTruthy();
    expect(adapter.isBefore(dateTime())).toBeTruthy();
  });

  it('isBeforeOrEqual()', () => {
    expect(adapter.isBeforeOrEqual(adapter)).toBeTruthy();
    expect(adapter.isBeforeOrEqual(dateTime(1969, 1, 1))).toBeFalsy();
    expect(adapter.isBeforeOrEqual(dateTime(1971, 1, 1))).toBeTruthy();
    expect(adapter.isBeforeOrEqual(dateTime())).toBeTruthy();
  });

  it('isAfter()', () => {
    expect(adapter.isAfter(adapter)).toBeFalsy();
    expect(adapter.isAfter(dateTime(1969, 1, 1))).toBeTruthy();
    expect(adapter.isAfter(dateTime(1971, 1, 1))).toBeFalsy();
    expect(adapter.isAfter(dateTime())).toBeFalsy();
  });

  it('isAfterOrEqual()', () => {
    expect(adapter.isAfterOrEqual(adapter)).toBeTruthy();
    expect(adapter.isAfterOrEqual(dateTime(1969, 1, 1))).toBeTruthy();
    expect(adapter.isAfterOrEqual(dateTime(1971, 1, 1))).toBeFalsy();
    expect(adapter.isAfterOrEqual(dateTime())).toBeFalsy();
  });

  it('assertIsValid()', () => {
    expect(() => dateTime(1970, 1, 1, 'apple' as any, 1)).toThrowError();
  });

  it('toISOString()', () => {
    expect(adapter.toISOString()).toBe('1970-01-01T01:01:01.001Z');
  });

  it('valueOf()', () => {
    expect(adapter.valueOf()).toBe(3661001);
  });

  it('timezone', () => expect(adapter.timezone).toBe('UTC'));

  it('toJSON()', () => {
    expect(adapter.toJSON()).toEqual({
      timezone: 'UTC',
      year: 1970,
      month: 1,
      day: 1,
      hour: 1,
      minute: 1,
      second: 1,
      millisecond: 1,
    });
  });

  describe('add()', () => {
    describe('year', () => {
      it('1', () =>
        expect(adapter.add(1, 'year').toISOString()).toBe(isoString(1971, 1, 1, 1, 1, 1, 1)));
      it('13', () =>
        expect(adapter.add(13, 'year').toISOString()).toBe(isoString(1983, 1, 1, 1, 1, 1, 1)));
    });

    describe('month', () => {
      it('1', () =>
        expect(adapter.add(1, 'month').toISOString()).toBe(isoString(1970, 2, 1, 1, 1, 1, 1)));
      it('13', () =>
        expect(adapter.add(13, 'month').toISOString()).toBe(isoString(1971, 2, 1, 1, 1, 1, 1)));
    });

    describe('week', () => {
      it('1', () =>
        expect(adapter.add(1, 'week').toISOString()).toBe(isoString(1970, 1, 8, 1, 1, 1, 1)));
      it('13', () =>
        expect(adapter.add(13, 'week').toISOString()).toBe(isoString(1970, 4, 2, 1, 1, 1, 1)));
    });

    describe('day', () => {
      it('1', () =>
        expect(adapter.add(1, 'day').toISOString()).toBe(isoString(1970, 1, 2, 1, 1, 1, 1)));
      it('13', () =>
        expect(adapter.add(13, 'day').toISOString()).toBe(isoString(1970, 1, 14, 1, 1, 1, 1)));
    });

    describe('hour', () => {
      it('1', () =>
        expect(adapter.add(1, 'hour').toISOString()).toBe(isoString(1970, 1, 1, 2, 1, 1, 1)));
      it('13', () =>
        expect(adapter.add(13, 'hour').toISOString()).toBe(isoString(1970, 1, 1, 14, 1, 1, 1)));
    });

    describe('minute', () => {
      it('1', () =>
        expect(adapter.add(1, 'minute').toISOString()).toBe(isoString(1970, 1, 1, 1, 2, 1, 1)));
      it('13', () =>
        expect(adapter.add(13, 'minute').toISOString()).toBe(isoString(1970, 1, 1, 1, 14, 1, 1)));
    });

    describe('second', () => {
      it('1', () =>
        expect(adapter.add(1, 'second').toISOString()).toBe(isoString(1970, 1, 1, 1, 1, 2, 1)));
      it('13', () =>
        expect(adapter.add(13, 'second').toISOString()).toBe(isoString(1970, 1, 1, 1, 1, 14, 1)));
    });

    describe('millisecond', () => {
      it('1', () =>
        expect(adapter.add(1, 'millisecond').toISOString()).toBe(
          isoString(1970, 1, 1, 1, 1, 1, 2),
        ));
      it('13', () =>
        expect(adapter.add(13, 'millisecond').toISOString()).toBe(
          isoString(1970, 1, 1, 1, 1, 1, 14),
        ));
    });
  });

  describe('subtract()', () => {
    describe('year', () => {
      it('1', () =>
        expect(adapter.subtract(1, 'year').toISOString()).toBe(isoString(1969, 1, 1, 1, 1, 1, 1)));
      it('13', () =>
        expect(adapter.subtract(13, 'year').toISOString()).toBe(isoString(1957, 1, 1, 1, 1, 1, 1)));
    });

    describe('month', () => {
      it('1', () =>
        expect(adapter.subtract(1, 'month').toISOString()).toBe(
          isoString(1969, 12, 1, 1, 1, 1, 1),
        ));
      it('13', () =>
        expect(adapter.subtract(13, 'month').toISOString()).toBe(
          isoString(1968, 12, 1, 1, 1, 1, 1),
        ));
    });

    describe('week', () => {
      it('1', () =>
        expect(adapter.subtract(1, 'week').toISOString()).toBe(
          isoString(1969, 12, 25, 1, 1, 1, 1),
        ));
      it('13', () =>
        expect(adapter.subtract(13, 'week').toISOString()).toBe(
          isoString(1969, 10, 2, 1, 1, 1, 1),
        ));
    });

    describe('day', () => {
      it('1', () =>
        expect(adapter.subtract(1, 'day').toISOString()).toBe(isoString(1969, 12, 31, 1, 1, 1, 1)));
      it('13', () =>
        expect(adapter.subtract(13, 'day').toISOString()).toBe(
          isoString(1969, 12, 19, 1, 1, 1, 1),
        ));
    });

    describe('hour', () => {
      it('1', () =>
        expect(adapter.subtract(1, 'hour').toISOString()).toBe(isoString(1970, 1, 1, 0, 1, 1, 1)));
      it('13', () =>
        expect(adapter.subtract(13, 'hour').toISOString()).toBe(
          isoString(1969, 12, 31, 12, 1, 1, 1),
        ));
    });

    describe('minute', () => {
      it('1', () =>
        expect(adapter.subtract(1, 'minute').toISOString()).toBe(
          isoString(1970, 1, 1, 1, 0, 1, 1),
        ));
      it('13', () =>
        expect(adapter.subtract(13, 'minute').toISOString()).toBe(
          isoString(1970, 1, 1, 0, 48, 1, 1),
        ));
    });

    describe('second', () => {
      it('1', () =>
        expect(adapter.subtract(1, 'second').toISOString()).toBe(
          isoString(1970, 1, 1, 1, 1, 0, 1),
        ));
      it('13', () =>
        expect(adapter.subtract(13, 'second').toISOString()).toBe(
          isoString(1970, 1, 1, 1, 0, 48, 1),
        ));
    });

    describe('millisecond', () => {
      it('1', () =>
        expect(adapter.subtract(1, 'millisecond').toISOString()).toBe(
          isoString(1970, 1, 1, 1, 1, 1, 0),
        ));
      it('13', () =>
        expect(adapter.subtract(13, 'millisecond').toISOString()).toBe(
          isoString(1970, 1, 1, 1, 1, 0, 988),
        ));
    });
  });

  // DateTime is always stored in UTC
  describe('get()', () => {
    it('year', () => expect(adapter.get('year')).toBe(date.getUTCFullYear()));

    it('month', () => expect(adapter.get('month')).toBe(date.getUTCMonth() + 1));

    it('yearday', () => expect(adapter.get('yearday')).toBe(1));

    it('weekday', () => expect(adapter.get('weekday')).toBe('TH'));

    it('day', () => expect(adapter.get('day')).toBe(date.getUTCDate()));

    it('hour', () => expect(adapter.get('hour')).toBe(date.getUTCHours()));

    it('minute', () => expect(adapter.get('minute')).toBe(date.getUTCMinutes()));

    it('second', () => expect(adapter.get('second')).toBe(date.getUTCSeconds()));

    it('millisecond', () => expect(adapter.get('millisecond')).toBe(date.getUTCMilliseconds()));
  });

  // DateTime is always stored in UTC
  describe('set()', () => {
    it('year', () => {
      const date1 = new Date(date);

      date1.setUTCFullYear(2000);

      expect(adapter.set('year', 2000).toISOString()).toBe(date1.toISOString());
    });

    it('month', () => {
      const date1 = new Date(date);

      date1.setUTCMonth(4);

      expect(adapter.set('month', 5).toISOString()).toBe(date1.toISOString());
    });

    it('day', () => {
      const date1 = new Date(date);

      date1.setUTCDate(20);

      expect(adapter.set('day', 20).toISOString()).toBe(date1.toISOString());
    });

    it('hour', () => {
      const date1 = new Date(date);

      date1.setUTCHours(3);

      expect(adapter.set('hour', 3).toISOString()).toBe(date1.toISOString());
    });

    it('minute', () => {
      const date1 = new Date(date);

      date1.setUTCMinutes(4);

      expect(adapter.set('minute', 4).toISOString()).toBe(date1.toISOString());
    });

    it('second', () => {
      const date1 = new Date(date);

      date1.setUTCSeconds(5);

      expect(adapter.set('second', 5).toISOString()).toBe(date1.toISOString());
    });

    it('millisecond', () => {
      const date1 = new Date(date);

      date1.setUTCMilliseconds(5);

      expect(adapter.set('millisecond', 5).toISOString()).toBe(date1.toISOString());
    });
  });

  // DateTime is always stored in UTC
  describe('granularity()', () => {
    it('year', () => {
      const date1 = new Date(date);

      date1.setUTCMonth(0);
      date1.setUTCDate(1);
      date1.setUTCHours(0);
      date1.setUTCMinutes(0);
      date1.setUTCSeconds(0);
      date1.setUTCMilliseconds(0);

      expect(adapter.granularity('year').toISOString()).toBe(date1.toISOString());
    });

    it('month', () => {
      const date1 = new Date(date);

      date1.setUTCDate(1);
      date1.setUTCHours(0);
      date1.setUTCMinutes(0);
      date1.setUTCSeconds(0);
      date1.setUTCMilliseconds(0);

      expect(adapter.granularity('month').toISOString()).toBe(date1.toISOString());
    });

    it('day', () => {
      const date1 = new Date(date);

      date1.setUTCHours(0);
      date1.setUTCMinutes(0);
      date1.setUTCSeconds(0);
      date1.setUTCMilliseconds(0);

      expect(adapter.granularity('day').toISOString()).toBe(date1.toISOString());
    });

    it('hour', () => {
      const date1 = new Date(date);

      date1.setUTCMinutes(0);
      date1.setUTCSeconds(0);
      date1.setUTCMilliseconds(0);

      expect(adapter.granularity('hour').toISOString()).toBe(date1.toISOString());
    });

    it('minute', () => {
      const date1 = new Date(date);

      date1.setUTCSeconds(0);
      date1.setUTCMilliseconds(0);

      expect(adapter.granularity('minute').toISOString()).toBe(date1.toISOString());
    });

    it('second', () => {
      const date1 = new Date(date);

      date1.setUTCMilliseconds(0);

      expect(adapter.granularity('second').toISOString()).toBe(date1.toISOString());
    });

    it('millisecond', () => {
      const date1 = new Date(date);

      expect(adapter.granularity('millisecond').toISOString()).toBe(date1.toISOString());
    });
  });

  describe('specific bugs', () => {
    it('set month from last day in Dec to Sep', () => {
      expect(
        dateTime(1997, 12, 31, 23, 59, 59, 999)
          .set('month', 9)
          .toISOString(),
      ).toEqual('1997-09-30T23:59:59.999Z');
    });
  });
});
