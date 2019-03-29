export enum EScaleStates {
  threeHours
}

export interface IProject {
  id: string;
  name: string;
  tasks?: Array<ITasks>;
  projectChildren?: IProject;
  projectParent?: IProject;
  orderList: number;
}

export interface ITasks {
  id: string;
  name: string;
  color: string;
  date: ITaskDate;
  progress: number;
  dependencies: IDependencies;
  orderList: number;
}

export interface ITaskDate {
  from: Date;
  to: Date;
}

export interface IDependencies {
  from?: Array<ITasks>;
  to?: Array<ITasks>;
}
