export enum EScaleStates {
  hours
}

export interface IProject {
  id: string;
  name: string;
  color: string;
  date: IDate;
  tasks?: Array<ITasks>;
  projectChildren?: Array<IProject>;
  projectParent?: Array<IProject>;
  genealogyDegree: number;
  collapsed: boolean;
}

export interface ITasks {
  id: string;
  name: string;
  color: string;
  date: IDate;
  progress: number;
  dependencies: IDependencies;
  genealogyDegree: number;
  collapsed: boolean;
}

export interface IDate {
  from: Date;
  to: Date;
}

export interface IDependencies {
  from?: Array<ITasks>;
  to?: Array<ITasks>;
}
