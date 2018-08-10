export class PipeRule {
    constructor(controller) {
        this.controller = controller;
    }
    get options() {
        return this.controller.options;
    }
    get start() {
        return this.controller.start;
    }
    get end() {
        return this.controller.end;
    }
    get count() {
        return this.controller.count;
    }
    get isIteratingInReverseOrder() {
        return this.controller.isIteratingInReverseOrder;
    }
    get expandingPipes() {
        return this.controller.expandingPipes;
    }
    get focusedPipe() {
        return this.controller.focusedPipe;
    }
    cloneDateWithGranularity(date, granularity) {
        date = date.clone();
        switch (granularity) {
            case 'year':
                date.set('month', 1);
            case 'month':
                date.set('day', 1);
            case 'day':
                date.set('hour', 0);
            case 'hour':
                date.set('minute', 0);
            case 'minute':
                date.set('second', 0);
            case 'second':
                return date;
            default:
                throw 'Woops! the PipeController somehow has invalid options...';
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvcGlwZXMvaW50ZXJmYWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE0QkEsTUFBTTtJQUdKLFlBQW1CLFVBQThCO1FBQTlCLGVBQVUsR0FBVixVQUFVLENBQW9CO0lBQUcsQ0FBQztJQUVyRCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFBO0lBQ2hDLENBQUM7SUFDRCxJQUFJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFBO0lBQzlCLENBQUM7SUFDRCxJQUFJLEdBQUc7UUFDTCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFBO0lBQzVCLENBQUM7SUFDRCxJQUFJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFBO0lBQzlCLENBQUM7SUFDRCxJQUFJLHlCQUF5QjtRQUMzQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMseUJBQXlCLENBQUE7SUFDbEQsQ0FBQztJQUNELElBQUksY0FBYztRQUNoQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFBO0lBQ3ZDLENBQUM7SUFDRCxJQUFJLFdBQVc7UUFDYixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFBO0lBQ3BDLENBQUM7SUFFUyx3QkFBd0IsQ0FDaEMsSUFBTyxFQUNQLFdBQW9FO1FBRXBFLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7UUFFbkIsUUFBUSxXQUFXLEVBQUU7WUFDbkIsS0FBSyxNQUFNO2dCQUNULElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3RCLEtBQUssT0FBTztnQkFDVixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUNwQixLQUFLLEtBQUs7Z0JBQ1IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDckIsS0FBSyxNQUFNO2dCQUNULElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3ZCLEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUN2QixLQUFLLFFBQVE7Z0JBQ1gsT0FBTyxJQUFJLENBQUE7WUFDYjtnQkFDRSxNQUFNLDBEQUEwRCxDQUFBO1NBQ25FO0lBQ0gsQ0FBQztDQUNGIn0=