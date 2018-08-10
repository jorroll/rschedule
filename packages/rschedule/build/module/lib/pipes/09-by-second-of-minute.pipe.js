import { PipeRule } from './interfaces';
export class BySecondOfMinutePipe extends PipeRule {
    constructor() {
        super(...arguments);
        this.upcomingSeconds = [];
    }
    run(args) {
        if (args.invalidDate)
            return this.nextPipe.run(args);
        if (this.options.frequency === 'SECONDLY') {
            return this.filter(args);
        }
        else
            return this.expand(args);
    }
    expand(args) {
        const date = args.date;
        if (this.upcomingSeconds.length === 0) {
            this.upcomingSeconds = this.options.bySecondOfMinute.filter(second => date.get('second') <= second);
            if (this.upcomingSeconds.length === 0) {
                return this.nextPipe.run({ date, invalidDate: true });
            }
            this.expandingPipes.push(this);
        }
        let nextSecond = this.upcomingSeconds.shift();
        date.set('second', nextSecond);
        if (this.upcomingSeconds.length === 0)
            this.expandingPipes.pop();
        return this.nextPipe.run({ date });
    }
    filter(args) {
        let validSecond = false;
        let nextValidSecondThisMinute = null;
        // bySecondOfMinute array is sorted
        for (const second of this.options.bySecondOfMinute) {
            if (args.date.get('second') === second) {
                validSecond = true;
                break;
            }
            else if (args.date.get('second') < second) {
                nextValidSecondThisMinute = second;
                break;
            }
        }
        if (validSecond)
            return this.nextPipe.run({ date: args.date });
        let next;
        // if the current date does not pass this filter,
        // is it possible for a date to pass this filter for the remainder of the minute?
        if (nextValidSecondThisMinute !== null) {
            // if yes, advance the current date forward to the next second which would pass
            // this filter
            next = this.cloneDateWithGranularity(args.date, 'second');
            next.set('second', nextValidSecondThisMinute);
        }
        else {
            // if no, advance the current date forward one minute &
            // and set the date to whatever second would pass this filter
            next = this.cloneDateWithGranularity(args.date, 'minute');
            next.add(1, 'minute');
            next.set('second', this.options.bySecondOfMinute[0]);
        }
        return this.nextPipe.run({
            invalidDate: true,
            date: args.date,
            skipToIntervalOnOrAfter: next,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMDktYnktc2Vjb25kLW9mLW1pbnV0ZS5waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9waXBlcy8wOS1ieS1zZWNvbmQtb2YtbWludXRlLnBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFFBQVEsRUFBeUIsTUFBTSxjQUFjLENBQUE7QUFHOUQsTUFBTSwyQkFBc0QsU0FBUSxRQUFXO0lBQS9FOztRQVVVLG9CQUFlLEdBQStCLEVBQUUsQ0FBQTtJQWtFMUQsQ0FBQztJQTFFQyxHQUFHLENBQUMsSUFBbUI7UUFDckIsSUFBSSxJQUFJLENBQUMsV0FBVztZQUFFLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFcEQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FBSyxVQUFVLEVBQUU7WUFDekMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQ3pCOztZQUFNLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBR0QsTUFBTSxDQUFDLElBQW1CO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7UUFFdEIsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDckMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFpQixDQUFDLE1BQU0sQ0FDMUQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLE1BQU0sQ0FDdkMsQ0FBQTtZQUVELElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNyQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO2FBQ3REO1lBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDL0I7UUFFRCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRyxDQUFBO1FBRTlDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1FBRTlCLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQztZQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUE7UUFFaEUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDcEMsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFtQjtRQUN4QixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUE7UUFDdkIsSUFBSSx5QkFBeUIsR0FBb0MsSUFBSSxDQUFBO1FBRXJFLG1DQUFtQztRQUNuQyxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWlCLEVBQUU7WUFDbkQsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxNQUFNLEVBQUU7Z0JBQ3RDLFdBQVcsR0FBRyxJQUFJLENBQUE7Z0JBQ2xCLE1BQUs7YUFDTjtpQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLE1BQU0sRUFBRTtnQkFDM0MseUJBQXlCLEdBQUcsTUFBTSxDQUFBO2dCQUNsQyxNQUFLO2FBQ047U0FDRjtRQUVELElBQUksV0FBVztZQUFFLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7UUFFOUQsSUFBSSxJQUFPLENBQUE7UUFFWCxpREFBaUQ7UUFDakQsaUZBQWlGO1FBRWpGLElBQUkseUJBQXlCLEtBQUssSUFBSSxFQUFFO1lBQ3RDLCtFQUErRTtZQUMvRSxjQUFjO1lBQ2QsSUFBSSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLHlCQUF5QixDQUFDLENBQUE7U0FDOUM7YUFBTTtZQUNMLHVEQUF1RDtZQUN2RCw2REFBNkQ7WUFDN0QsSUFBSSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtTQUN0RDtRQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFDdkIsV0FBVyxFQUFFLElBQUk7WUFDakIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsdUJBQXVCLEVBQUUsSUFBSTtTQUM5QixDQUFDLENBQUE7SUFDSixDQUFDO0NBQ0YifQ==