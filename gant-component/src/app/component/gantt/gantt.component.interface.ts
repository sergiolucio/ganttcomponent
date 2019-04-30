export enum EScaleStates {
  hours
}

export interface IInputOptions {
  range: IDate;
  viewScale: number;
  editScale: number;
}

export interface IItems {
  [id: string]: IItem;
}

export interface IItem {
  name: string;
  color: string;
  date: IDate;
  progress?: number;
  _hasPrevious?: boolean;
  _hasLinks?: boolean;
  links?: Array<ILink>;
  genealogyDegree: number;
  collapsed: boolean;
  _descriptionStyle?: IStyle;
  _detailsStyle?: IStyle;
  _hasChildren?: boolean;
  itemsChildren?: IItems;
  _itemsChildrenKeys?: Array<string>;
  _itemsNumber?: number;
  _orderNumber?: number;
}

export interface ILink {
  data: IItem;
  style?: IStyle;
}

export interface IDate {
  from: Date;
  to: Date;
}

interface IStyle {
  [property: string]: string;
}
