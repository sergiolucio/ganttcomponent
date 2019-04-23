export enum EScaleStates {
  hours
}

export interface IInputOptions {
  range: IDate;
  viewScale: number;
  editScale: number;
}

export interface IProjects {
  [id: string]: IProject;
}

export interface IProject extends ITask {
  _hasTasks?: boolean;
  tasks?: ITasks;
  _tasksKeys?: Array<string>;
  _hasChildren?: boolean;
  projectChildren?: IProjects;
  _projectChildrenKeys?: Array<string>;
  _projectItems?: number;
}

export interface ITasks {
  [id: string]: ITask;
}

export interface ITask {
  name: string;
  color: string;
  date: IDate;
  progress?: number;
  dependencies?: IDependencies;
  genealogyDegree: number;
  collapsed: boolean;
  _descriptionStyle?: IStyle;
  _detailsStyle?: IStyle;
}

export interface IDate {
  from: Date;
  to: Date;
}

export interface IDependencies {
  from?: ITask;
  to?: ITask;
}

interface IStyle {
  [property: string]: string;
}
