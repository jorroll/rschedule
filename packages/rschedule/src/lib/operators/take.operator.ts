import { DateAdapter } from '../date-adapter'
import { OccurrencesArgs } from '../interfaces'
import { IOperator, StreamOperator } from './interface';

export class TakeOperator<T extends DateAdapter<T>> extends StreamOperator<T, TakeOperator<T>> implements IOperator<T> {

  clone() {
    return new TakeOperator(this.stream.clone())
  }

  *_run(args: OccurrencesArgs<T> = {}) {
    const count = args.take;
    
    delete args.take;

    const iterator = this.stream._run(args)

    let date = iterator.next().value
    let index = 0
  
    while (date && (count === undefined || count > index)) {  
      const yieldArgs = yield date.clone()

      date = iterator.next(yieldArgs).value

      index++
    }
  }

}
