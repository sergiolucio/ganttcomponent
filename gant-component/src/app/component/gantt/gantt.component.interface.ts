export enum EScaleStates {
  threeHours
}

export interface IProject {
  id: string;
  name: string;
  color: string;
  date: IDate;
  tasks?: Array<ITasks>;
  projectChildren?: Array<IProject>;
  projectParent?: Array<IProject>;
  orderList: number;
  genealogyDegree: number;
}

export interface ITasks {
  id: string;
  name: string;
  color: string;
  date: IDate;
  progress: number;
  dependencies: IDependencies;
  orderList: number;
  genealogyDegree: number;
}

export interface IDate {
  from: Date;
  to: Date;
}

export interface IDependencies {
  from?: Array<ITasks>;
  to?: Array<ITasks>;
}



export interface IGanttItem<T> {
  id: string;
  name: string;
  color: string;
  date: IDate;
  progress: number;
  dependencies: IDependencies;
  parentId: string;
  childrenId: string;
  orderList: number;
  body: T;
}
