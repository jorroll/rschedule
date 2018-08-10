export class HasOccurrences {
    // just to satisfy the interface
    occurrences(args) {
        return args;
    }
    occursBetween(start, end, options = {}) {
        for (const day of this.occurrences({ start, end })) {
            if (options.excludingEnds) {
                if (day.isEqual(start))
                    continue;
                if (day.isEqual(end))
                    break;
            }
            return true;
        }
        return false;
    }
    occursOn(date) {
        for (const day of this.occurrences({ start: date, end: date })) {
            return !!day;
        }
        return false;
    }
    occursAfter(date, options = {}) {
        for (const day of this.occurrences({ start: date })) {
            if (options.excludeStart && day.isEqual(date))
                continue;
            return true;
        }
        return false;
    }
}
export class OccurrenceIterator {
    constructor(iterable, args) {
        this.iterable = iterable;
        this.args = args;
        this[Symbol.iterator] = () => this.iterator;
        this.iterator = iterable._run(args);
    }
    next() {
        return this.iterator.next();
    }
    toArray() {
        if (!this.args.end && !this.args.take && this.iterable.isInfinite)
            return undefined;
        else {
            const occurrences = [];
            for (const date of this.iterable._run(this.args)) {
                occurrences.push(date);
            }
            return occurrences;
        }
    }
}
// export class UndefinedIterator implements IterableIterator<undefined> {
//   [Symbol.iterator] = this.iterate
//   next() { return { value: undefined, done: true } }
//   toArray() { return undefined }
//   *iterate() {
//     while (false) {
//       yield undefined
//     }
//   }
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaW50ZXJmYWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF5QkEsTUFBTTtJQUNKLGdDQUFnQztJQUNoQyxXQUFXLENBQUMsSUFBUztRQUNuQixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxhQUFhLENBQUMsS0FBUSxFQUFFLEdBQU0sRUFBRSxVQUF1QyxFQUFFO1FBQ3ZFLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO1lBQ2xELElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRTtnQkFDekIsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztvQkFBRSxTQUFRO2dCQUNoQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO29CQUFFLE1BQUs7YUFDNUI7WUFFRCxPQUFPLElBQUksQ0FBQTtTQUNaO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsUUFBUSxDQUFDLElBQU87UUFDZCxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO1lBQzlELE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQTtTQUNiO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRUQsV0FBVyxDQUFDLElBQU8sRUFBRSxVQUFzQyxFQUFFO1FBQzNELEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO1lBQ25ELElBQUksT0FBTyxDQUFDLFlBQVksSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFBRSxTQUFRO1lBQ3ZELE9BQU8sSUFBSSxDQUFBO1NBQ1o7UUFDRCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7Q0FDRjtBQUVELE1BQU07SUFHSixZQUFvQixRQUFXLEVBQVUsSUFBd0I7UUFBN0MsYUFBUSxHQUFSLFFBQVEsQ0FBRztRQUFVLFNBQUksR0FBSixJQUFJLENBQW9CO1FBSWpFLEtBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUE7UUFIckMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3JDLENBQUM7SUFJRCxJQUFJO1FBQ0YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFBO0lBQzdCLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO1lBQUUsT0FBTyxTQUFTLENBQUE7YUFDOUU7WUFDSCxNQUFNLFdBQVcsR0FBUSxFQUFFLENBQUE7WUFDM0IsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2hELFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7YUFDdkI7WUFDRCxPQUFPLFdBQVcsQ0FBQTtTQUNuQjtJQUNILENBQUM7Q0FDRjtBQUVELDBFQUEwRTtBQUMxRSxxQ0FBcUM7QUFFckMsdURBQXVEO0FBRXZELG1DQUFtQztBQUVuQyxpQkFBaUI7QUFDakIsc0JBQXNCO0FBQ3RCLHdCQUF3QjtBQUN4QixRQUFRO0FBQ1IsTUFBTTtBQUNOLElBQUkifQ==