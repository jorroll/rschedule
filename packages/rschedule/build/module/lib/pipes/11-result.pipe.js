import { PipeRule } from './interfaces';
export class PipeError extends Error {
}
export class ResultPipe extends PipeRule {
    constructor() {
        super(...arguments);
        this.invalidIterationCount = 0;
    }
    // This pipe exists to facilitate the adding of dev callbacks to an iteration
    // of the pipe. It is meant to always be the last pipe in the chain.
    run(args) {
        if (this.controller.invalid) {
            throw "Ooops! You've continued to use a rule iterator object " +
                'after having updated `Rule#options`. ' +
                'See the PipeController#invalid source code for more info.';
        }
        if (this.end && args.date.isAfter(this.end))
            return null;
        if (args.invalidDate) {
            // To prevent getting into an infinite loop.
            // - I somewhat arbitrarily chose 50
            // - I noticed that, when limited to 10 iterations, some tests failed
            this.invalidIterationCount++;
            if (this.invalidIterationCount > 50) {
                throw new PipeError('Failed to find a single matching occurrence in 50 iterations. ' +
                    `Last iterated date: "${args.date.toISOString()}"`);
            }
        }
        else {
            if (this.previousIterationDate && this.previousIterationDate.isAfterOrEqual(args.date)) {
                console.error(`Previous run's date is after or equal current run's date of "${args.date.toISOString()}". ` +
                    'This is probably caused by a bug.');
                return null;
            }
            this.previousIterationDate = args.date.clone();
            this.invalidIterationCount = 0;
        }
        return args.invalidDate ? this.focusedPipe.run({ ...args, invalidDate: false }) : args.date;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMTEtcmVzdWx0LnBpcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3BpcGVzLzExLXJlc3VsdC5waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxRQUFRLEVBQXlCLE1BQU0sY0FBYyxDQUFBO0FBRTlELE1BQU0sZ0JBQWlCLFNBQVEsS0FBSztDQUFHO0FBRXZDLE1BQU0saUJBQTRDLFNBQVEsUUFBVztJQUFyRTs7UUFDVSwwQkFBcUIsR0FBRyxDQUFDLENBQUE7SUF3Q25DLENBQUM7SUFyQ0MsNkVBQTZFO0lBQzdFLG9FQUFvRTtJQUNwRSxHQUFHLENBQUMsSUFBbUI7UUFDckIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRTtZQUMzQixNQUFNLHdEQUF3RDtnQkFDNUQsdUNBQXVDO2dCQUN2QywyREFBMkQsQ0FBQTtTQUM5RDtRQUVELElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQUUsT0FBTyxJQUFJLENBQUE7UUFFeEQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLDRDQUE0QztZQUM1QyxvQ0FBb0M7WUFDcEMscUVBQXFFO1lBQ3JFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFBO1lBQzVCLElBQUksSUFBSSxDQUFDLHFCQUFxQixHQUFHLEVBQUUsRUFBRTtnQkFDbkMsTUFBTSxJQUFJLFNBQVMsQ0FDakIsZ0VBQWdFO29CQUM5RCx3QkFBd0IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUNyRCxDQUFBO2FBQ0Y7U0FDRjthQUFNO1lBQ0wsSUFBSSxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3RGLE9BQU8sQ0FBQyxLQUFLLENBQ1gsZ0VBQWdFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUs7b0JBQzFGLG1DQUFtQyxDQUN0QyxDQUFBO2dCQUNELE9BQU8sSUFBSSxDQUFBO2FBQ1o7WUFFRCxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtZQUM5QyxJQUFJLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFBO1NBQy9CO1FBRUQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQzdGLENBQUM7Q0FDRiJ9