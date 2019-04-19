export interface IDataContainer<D> {
  data: D;
}

export type DataFor<O> = O extends IDataContainer<infer D> ? D : never;
