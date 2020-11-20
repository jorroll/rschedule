import { DateAdapterBase } from '@rschedule/core';

import { context, dateAdapterFn, TIMEZONES } from '../../../../tests/utilities';

export default function dateAdapterTests() {
  describe('DateAdapterTests', () => {
    context(DateAdapterBase.adapter.name, () => {
      // const timezones: (string | null)[] = !DateAdapterBase.adapter.hasTimezoneSupport
      //   ? [null]
      //   : [null];

      const timezones = !DateAdapterBase.adapter.hasTimezoneSupport ? [null, 'UTC'] : TIMEZONES;

      timezones.forEach(zone => {
        context(zone, timezone => {
          const dateAdapter = dateAdapterFn(timezone);

          const dateLOCAL = dateAdapter(1997, 9, 2, 9);
          const dateUTC = dateAdapter(1997, 9, 2, 9, { timezone: 'UTC' });

          it('initializes', () => {
            expect(dateLOCAL.duration).toBe(0);
            expect(dateLOCAL.end).toBe(undefined);
            expect(dateLOCAL.generators).toEqual([]);
            expect(dateLOCAL.timezone).toBe(timezone);
            expect(typeof dateLOCAL.date).toBe('object');

            expect(dateUTC.duration).toBe(0);
            expect(dateUTC.end).toBe(undefined);
            expect(dateUTC.generators).toEqual([]);
            expect(dateUTC.timezone).toBe('UTC');
            expect(typeof dateUTC.date).toBe('object');
          });

          describe('set', () => {
            describe('dateLOCAL', () => {
              it('duration', () => {
                const duration = 10;
                const change = dateLOCAL.set('duration', duration);
                expect(change).not.toBe(dateLOCAL);
                expect(change.duration).toBe(duration);
              });

              describe('timezone', () => {
                timezones.forEach(tz => {
                  it(`${tz}`, () => {
                    const change = dateLOCAL.set('timezone', timezone);
                    expect(change.timezone).toBe(timezone);
                  });
                });
              });
            });

            describe('dateUTC', () => {
              it('duration', () => {
                const duration = 10;
                const change = dateUTC.set('duration', duration);
                expect(change).not.toBe(dateUTC);
                expect(change.duration).toBe(duration);
                expect(change.timezone).toBe('UTC');
              });

              describe('timezone', () => {
                timezones.forEach(tz => {
                  it(`${tz}`, () => {
                    const change = dateUTC.set('timezone', timezone);
                    expect(change.timezone).toBe(timezone);
                  });
                });
              });
            });
          });

          describe('toDateTime', () => {
            describe('dateLOCAL', () => {
              it('', () => {
                const datetime = dateLOCAL.toDateTime();

                expect(datetime.toJSON()).toEqual({
                  timezone,
                  year: 1997,
                  month: 9,
                  day: 2,
                  hour: 9,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                });

                expect(datetime.duration).toEqual(0);
                expect(datetime.end).toEqual(undefined);
                expect(datetime.generators).toEqual([]);
                expect(datetime.timezone).toEqual(timezone);
              });

              it('with duration', () => {
                const datetime = dateLOCAL.set('duration', 10).toDateTime();

                expect(datetime.toJSON()).toEqual({
                  timezone,
                  duration: 10,
                  year: 1997,
                  month: 9,
                  day: 2,
                  hour: 9,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                });

                expect(datetime.duration).toEqual(10);
                expect(datetime.end).toBeTruthy();
                expect(datetime.generators).toEqual([]);
                expect(datetime.timezone).toEqual(timezone);
              });
            });

            describe('dateUTC', () => {
              it('', () => {
                const datetime = dateUTC.toDateTime();

                expect(datetime.toJSON()).toEqual({
                  timezone: 'UTC',
                  year: 1997,
                  month: 9,
                  day: 2,
                  hour: 9,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                });

                expect(datetime.duration).toEqual(0);
                expect(datetime.end).toEqual(undefined);
                expect(datetime.generators).toEqual([]);
                expect(datetime.timezone).toEqual('UTC');
              });

              it('with duration', () => {
                const datetime = dateUTC.set('duration', 10).toDateTime();

                expect(datetime.toJSON()).toEqual({
                  timezone: 'UTC',
                  duration: 10,
                  year: 1997,
                  month: 9,
                  day: 2,
                  hour: 9,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                });

                expect(datetime.duration).toEqual(10);
                expect(datetime.end).toBeTruthy();
                expect(datetime.generators).toEqual([]);
                expect(datetime.timezone).toEqual('UTC');
              });
            });
          });

          describe('toISOString', () => {
            describe('dateLOCAL', () => {
              it('', () => {
                expect(typeof dateLOCAL.toISOString()).toBe('string');
              });
            });

            describe('dateUTC', () => {
              it('', () => {
                expect(typeof dateUTC.toISOString()).toBe('string');
                expect(dateUTC.toISOString()).toBe(new Date(Date.UTC(1997, 8, 2, 9)).toISOString());
              });
            });
          });

          describe('toJSON', () => {
            describe('dateLOCAL', () => {
              it('', () => {
                expect(dateLOCAL.toJSON()).toEqual({
                  timezone,
                  year: 1997,
                  month: 9,
                  day: 2,
                  hour: 9,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                });
              });

              it('with duration', () => {
                expect(dateLOCAL.set('duration', 10).toJSON()).toEqual({
                  timezone,
                  duration: 10,
                  year: 1997,
                  month: 9,
                  day: 2,
                  hour: 9,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                });
              });
            });

            describe('dateUTC', () => {
              it('', () => {
                expect(dateUTC.toJSON()).toEqual({
                  timezone: 'UTC',
                  year: 1997,
                  month: 9,
                  day: 2,
                  hour: 9,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                });
              });

              it('with duration', () => {
                expect(dateUTC.set('duration', 10).toJSON()).toEqual({
                  timezone: 'UTC',
                  duration: 10,
                  year: 1997,
                  month: 9,
                  day: 2,
                  hour: 9,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                });
              });
            });
          });

          describe('valueOf', () => {
            describe('dateLOCAL', () => {
              it('', () => {
                expect(typeof dateLOCAL.valueOf()).toBe('number');
              });
            });

            describe('dateUTC', () => {
              it('', () => {
                expect(typeof dateUTC.valueOf()).toBe('number');
                expect(dateUTC.valueOf()).toBe(Date.UTC(1997, 8, 2, 9));
              });
            });
          });
        });
      });
    });
  });
}
