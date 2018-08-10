/**
 * This function performs validation checks on the provided rule options and retuns
 * a cloned validated options object.
 */
export function buildValidatedRuleOptions(options) {
    const start = options.start;
    if (options.interval !== undefined && options.interval < 1) {
        throw new RuleValidationError('"interval" cannot be less than 1');
    }
    if (options.bySecondOfMinute !== undefined &&
        options.bySecondOfMinute.some(num => num < 0 || num > 60)) {
        throw new RuleValidationError('"bySecondOfMinute" values must be >= 0 && <= 60');
    }
    if (options.byMinuteOfHour !== undefined &&
        options.byMinuteOfHour.some(num => num < 0 || num > 59)) {
        throw new RuleValidationError('"byMinuteOfHour" values must be >= 0 && <= 59');
    }
    if (options.byHourOfDay !== undefined && options.byHourOfDay.some(num => num < 0 || num > 23)) {
        throw new RuleValidationError('"byHourOfDay" values must be >= 0 && <= 23');
    }
    if (!['YEARLY', 'MONTHLY'].includes(options.frequency) &&
        options.byDayOfWeek !== undefined &&
        options.byDayOfWeek.some(weekday => Array.isArray(weekday))) {
        throw new RuleValidationError('"byDayOfWeek" can only include a numeric value when the "frequency" is ' +
            'either "MONTHLY" or "YEARLY"');
    }
    if (options.frequency === 'MONTHLY' &&
        options.byDayOfWeek !== undefined &&
        options.byDayOfWeek.some(weekday => Array.isArray(weekday) && (weekday[1] < -31 || weekday[1] === 0 || weekday[1] > 31))) {
        throw new RuleValidationError('when "frequency" is "MONTHLY", each "byDayOfWeek" can optionally only' +
            ' have a numeric value >= -31 and <= 31 and !== 0');
    }
    if (options.frequency === 'YEARLY' &&
        options.byDayOfWeek !== undefined &&
        options.byDayOfWeek.some(weekday => Array.isArray(weekday) && (weekday[1] < -366 || weekday[1] === 0 || weekday[1] > 366))) {
        throw new RuleValidationError('when "frequency" is "YEARLY", each "byDayOfWeek" can optionally only' +
            ' have a numeric value >= -366 and <= 366 and !== 0');
    }
    if (options.frequency === 'WEEKLY' && options.byDayOfMonth !== undefined) {
        throw new RuleValidationError('when "frequency" is "WEEKLY", "byDayOfMonth" cannot be present');
    }
    if (options.until !== undefined && options.count !== undefined) {
        throw new RuleValidationError('"until" and "count" cannot both be present');
    }
    if (options.until !== undefined && !options.until.isSameClass(start)) {
        throw new RuleValidationError('"until" and "start" must both be of the same class');
    }
    if (options.byMonthOfYear) {
        options.byMonthOfYear.sort((a, b) => {
            if (a > b)
                return 1;
            else if (b > a)
                return -1;
            else
                return 0;
        });
    }
    if (options.byHourOfDay) {
        options.byHourOfDay.sort((a, b) => {
            if (a > b)
                return 1;
            else if (b > a)
                return -1;
            else
                return 0;
        });
    }
    if (options.byMinuteOfHour) {
        options.byMinuteOfHour.sort((a, b) => {
            if (a > b)
                return 1;
            else if (b > a)
                return -1;
            else
                return 0;
        });
    }
    if (options.bySecondOfMinute) {
        options.bySecondOfMinute.sort((a, b) => {
            if (a > b)
                return 1;
            else if (b > a)
                return -1;
            else
                return 0;
        });
    }
    const defaultOptions = {
        start: options.start,
        frequency: options.frequency,
        interval: 1,
        weekStart: 'MO',
    };
    if (!(options.byDayOfMonth || options.byDayOfWeek)) {
        switch (options.frequency) {
            case 'YEARLY':
                defaultOptions.byMonthOfYear = [options.start.get('month')];
            case 'MONTHLY':
                defaultOptions.byDayOfMonth = [options.start.get('day')];
                break;
            case 'WEEKLY':
                defaultOptions.byDayOfWeek = [options.start.get('weekday')];
                break;
        }
    }
    switch (options.frequency) {
        case 'YEARLY':
        case 'MONTHLY':
        case 'WEEKLY':
        case 'DAILY':
            defaultOptions.byHourOfDay = [options.start.get('hour')];
        case 'HOURLY':
            defaultOptions.byMinuteOfHour = [options.start.get('minute')];
        case 'MINUTELY':
            defaultOptions.bySecondOfMinute = [options.start.get('second')];
    }
    return {
        ...defaultOptions,
        ...options,
        start: options.start.clone(),
    };
}
class RuleValidationError extends Error {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZS1vcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9ydWxlL3J1bGUtb3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQTs7O0dBR0c7QUFDSCxNQUFNLG9DQUNKLE9BQW1DO0lBRW5DLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUE7SUFFM0IsSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRTtRQUMxRCxNQUFNLElBQUksbUJBQW1CLENBQUMsa0NBQWtDLENBQUMsQ0FBQTtLQUNsRTtJQUNELElBQ0UsT0FBTyxDQUFDLGdCQUFnQixLQUFLLFNBQVM7UUFDdEMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUN6RDtRQUNBLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxpREFBaUQsQ0FBQyxDQUFBO0tBQ2pGO0lBQ0QsSUFDRSxPQUFPLENBQUMsY0FBYyxLQUFLLFNBQVM7UUFDcEMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFDdkQ7UUFDQSxNQUFNLElBQUksbUJBQW1CLENBQUMsK0NBQStDLENBQUMsQ0FBQTtLQUMvRTtJQUNELElBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxTQUFTLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRTtRQUM3RixNQUFNLElBQUksbUJBQW1CLENBQUMsNENBQTRDLENBQUMsQ0FBQTtLQUM1RTtJQUNELElBQ0UsQ0FBQyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUNsRCxPQUFPLENBQUMsV0FBVyxLQUFLLFNBQVM7UUFDakMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQzNEO1FBQ0EsTUFBTSxJQUFJLG1CQUFtQixDQUMzQix5RUFBeUU7WUFDdkUsOEJBQThCLENBQ2pDLENBQUE7S0FDRjtJQUNELElBQ0UsT0FBTyxDQUFDLFNBQVMsS0FBSyxTQUFTO1FBQy9CLE9BQU8sQ0FBQyxXQUFXLEtBQUssU0FBUztRQUNqQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FDdEIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUMvRixFQUNEO1FBQ0EsTUFBTSxJQUFJLG1CQUFtQixDQUMzQix1RUFBdUU7WUFDckUsa0RBQWtELENBQ3JELENBQUE7S0FDRjtJQUNELElBQ0UsT0FBTyxDQUFDLFNBQVMsS0FBSyxRQUFRO1FBQzlCLE9BQU8sQ0FBQyxXQUFXLEtBQUssU0FBUztRQUNqQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FDdEIsT0FBTyxDQUFDLEVBQUUsQ0FDUixLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUN4RixFQUNEO1FBQ0EsTUFBTSxJQUFJLG1CQUFtQixDQUMzQixzRUFBc0U7WUFDcEUsb0RBQW9ELENBQ3ZELENBQUE7S0FDRjtJQUNELElBQUksT0FBTyxDQUFDLFNBQVMsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLFlBQVksS0FBSyxTQUFTLEVBQUU7UUFDeEUsTUFBTSxJQUFJLG1CQUFtQixDQUMzQixnRUFBZ0UsQ0FDakUsQ0FBQTtLQUNGO0lBQ0QsSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUM5RCxNQUFNLElBQUksbUJBQW1CLENBQUMsNENBQTRDLENBQUMsQ0FBQTtLQUM1RTtJQUNELElBQUksT0FBTyxDQUFDLEtBQUssS0FBSyxTQUFTLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNyRSxNQUFNLElBQUksbUJBQW1CLENBQUMsb0RBQW9ELENBQUMsQ0FBQTtLQUNwRjtJQUVELElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRTtRQUN6QixPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNsQyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUFFLE9BQU8sQ0FBQyxDQUFBO2lCQUNkLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTs7Z0JBQ3BCLE9BQU8sQ0FBQyxDQUFBO1FBQ2YsQ0FBQyxDQUFDLENBQUE7S0FDSDtJQUVELElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRTtRQUN2QixPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUFFLE9BQU8sQ0FBQyxDQUFBO2lCQUNkLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTs7Z0JBQ3BCLE9BQU8sQ0FBQyxDQUFBO1FBQ2YsQ0FBQyxDQUFDLENBQUE7S0FDSDtJQUVELElBQUksT0FBTyxDQUFDLGNBQWMsRUFBRTtRQUMxQixPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUFFLE9BQU8sQ0FBQyxDQUFBO2lCQUNkLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTs7Z0JBQ3BCLE9BQU8sQ0FBQyxDQUFBO1FBQ2YsQ0FBQyxDQUFDLENBQUE7S0FDSDtJQUVELElBQUksT0FBTyxDQUFDLGdCQUFnQixFQUFFO1FBQzVCLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFBRSxPQUFPLENBQUMsQ0FBQTtpQkFDZCxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUE7O2dCQUNwQixPQUFPLENBQUMsQ0FBQTtRQUNmLENBQUMsQ0FBQyxDQUFBO0tBQ0g7SUFFRCxNQUFNLGNBQWMsR0FBZ0M7UUFDbEQsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3BCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztRQUM1QixRQUFRLEVBQUUsQ0FBQztRQUNYLFNBQVMsRUFBRSxJQUFJO0tBQ2hCLENBQUE7SUFFRCxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUNsRCxRQUFRLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDekIsS0FBSyxRQUFRO2dCQUNYLGNBQWMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBNEIsQ0FBQTtZQUN4RixLQUFLLFNBQVM7Z0JBQ1osY0FBYyxDQUFDLFlBQVksR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUEyQixDQUFBO2dCQUNsRixNQUFLO1lBQ1AsS0FBSyxRQUFRO2dCQUNYLGNBQWMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBMEIsQ0FBQTtnQkFDcEYsTUFBSztTQUNSO0tBQ0Y7SUFFRCxRQUFRLE9BQU8sQ0FBQyxTQUFTLEVBQUU7UUFDekIsS0FBSyxRQUFRLENBQUM7UUFDZCxLQUFLLFNBQVMsQ0FBQztRQUNmLEtBQUssUUFBUSxDQUFDO1FBQ2QsS0FBSyxPQUFPO1lBQ1YsY0FBYyxDQUFDLFdBQVcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUEwQixDQUFBO1FBQ25GLEtBQUssUUFBUTtZQUNYLGNBQWMsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBNkIsQ0FBQTtRQUMzRixLQUFLLFVBQVU7WUFDYixjQUFjLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBK0IsQ0FBQTtLQUNoRztJQUVELE9BQU87UUFDTCxHQUFHLGNBQWM7UUFDakIsR0FBRyxPQUFPO1FBQ1YsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFO0tBQzdCLENBQUE7QUFDSCxDQUFDO0FBRUQseUJBQTBCLFNBQVEsS0FBSztDQUFHIn0=