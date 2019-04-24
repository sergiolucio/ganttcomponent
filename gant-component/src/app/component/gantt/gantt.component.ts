import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {EScaleStates, IInputOptions, IItems, IItem} from './gantt.component.interface';
import {Observable} from 'rxjs';
import * as moment from 'moment';
import {Moment} from 'moment';

@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrls: ['./gantt.component.scss']
})
export class GanttComponent implements OnInit, OnChanges {
  // inputs recebidos  de opções
  @Input() inputOptionsPanelActive: boolean;
  @Input() inputOptions: IInputOptions;
  @Input() datePickerActive: boolean;
  @Input() timePickerActive: boolean;
  public viewScale: number;
  public editScale: number;
  public fromRange: Date;
  public toRange: Date;

  @Input() scaleState: EScaleStates;

  @Input() items: IItems;
  public itemsKeys: Array<string>;
  public itemsCounter: number;
  public itemDraggedOrCollapsedEvt: boolean;

  // variáveis de configuração de dimensões do layout
  public tasksParentWidth: number;
  public tasksDescWidth: number;
  public tasksWidth: number;
  public tasksDivisionWidth: number;
  public grabber: boolean;
  public oldX: number;
  public cellWidth: number;

  public scrollPosition: number;
  private _subItemsByItem: number;

  constructor() {}

  ngOnInit() {
    const myTasksParent = document.querySelector('div.row.tables-container');
    this.tasksParentWidth = myTasksParent.clientWidth;
    this.tasksDescWidth = this.tasksParentWidth * 0.285;
    this.tasksWidth = this.tasksParentWidth * 0.7;
    this.tasksDivisionWidth = this.tasksParentWidth * 0.005;
    this.grabber = false;
    this.cellWidth = 50;

    if (this.inputOptions) {
      this._inspectInputOptions();
    }

    if (this.items) {
      this.initInspectItems();
      this._initProjectsKeys();
    }

    this.itemDraggedOrCollapsedEvt = false;

    if (!this.scrollPosition) {
      this.scrollPosition = 0;
    }

    console.log(this.itemsCounter);
  }

  ngOnChanges({inputOptions, projects}: SimpleChanges): void {
    if (inputOptions && !inputOptions.isFirstChange()) {
      this._inspectInputOptions();
      this.initInspectItems();
    }

    if (projects && !projects.isFirstChange()) {
      this.initInspectItems();
      this._initProjectsKeys();
    }
  }

  // ======== código da barra separadora das tabelas - resizable
  public turnOnGrabber(event: any): void {
    this.grabber = true;
    this.oldX = event.clientX;
  }

  public resizeTables(event: any): void {
    if (this.grabber) {
      this.tasksDescWidth += event.clientX - this.oldX;
      this.tasksWidth -= event.clientX - this.oldX;
      this.oldX = event.clientX;
    }
  }

  public turnOffGrabber(event: any): void {
    this.grabber = false;
  }

  // ============================================================

  // ======== código do botão para esconder / mostrar o painel esquerdo de descrição das tabelas
  public toggleTasksDescription(): void {
    let myTasksDescBorder: number;
    const myTaskDivision = document.querySelector('div.tasks-division') as HTMLElement;

    if (this.tasksDescWidth > 0) {
      this.tasksDescWidth = 0;
      myTasksDescBorder = 0;
      this.tasksWidth = this.tasksParentWidth * 0.985;
      myTaskDivision.style.display = 'none';
    } else {
      this.tasksDescWidth = this.tasksParentWidth * 0.285;
      myTasksDescBorder = 0.5;
      this.tasksWidth = this.tasksParentWidth * 0.7;
      myTaskDivision.style.display = 'block';
    }

    const myTaskDescriptionContainer = document.querySelector('div.tasks-description-container') as HTMLElement;
    myTaskDescriptionContainer.style.border = myTasksDescBorder + 'px';

    const myTaskDescriptionToggle = document.querySelector('div.tasks-description-toggle');
    myTaskDescriptionToggle.classList.toggle('active');
  }

  // ============================================================

  public getItems(): Observable<IItems> {
    return new Observable<IItems>(observer => {
      observer.next(this.items);
    });
  }

  public initInspectItems(): void {
    this.itemsCounter = 0;

    for (const projKey of Object.keys(this.items)) {
      this._subItemsByItem = 0;
      this._inspectItems(this.items[projKey]);
      this.items[projKey]._itemsNumber = this._subItemsByItem;
    }

    for (const projKey of Object.keys(this.items)) {
      this._inspectNextItems(this.items[projKey]);
    }
  }

  private _inspectItems(item: IItem, mainProjectColor?: string): void {
    this.itemsCounter++; // contador de items totais
    this._subItemsByItem++; // contador de items por projeto

    item._hasChildren = !!item.itemsChildren && Object.keys(item.itemsChildren).length > 0;
    item._hasNextItems = !!item.nextItems && Object.keys(item.nextItems).length > 0;
    item._descriptionStyle = {};
    item._descriptionStyle['border-left'] = mainProjectColor ? '3px solid ' + mainProjectColor : '3px solid ' + item.color;
    item._descriptionStyle['padding-left'] = item.genealogyDegree * 15 + 'px';
    item._detailsStyle = {};
    item._detailsStyle['margin-left'] = this._findEventStart(item) + 'px';
    item._detailsStyle['background-color'] = item.color;
    if (this._findEventDuration(item) > 0) {
      item._detailsStyle['width'] = this._findEventDuration(item) + 'px';
      item._detailsStyle['border'] = '1px dimgray solid';
    } else {
      item._detailsStyle['width'] = this._findEventDuration(item) + 'px';
    }

    if (item._hasChildren) {
      item._itemsChildrenKeys = [];
      for (const projKey of Object.keys(item.itemsChildren)) {
        item._itemsChildrenKeys.push(projKey);
        this._inspectItems(item.itemsChildren[projKey], mainProjectColor ? mainProjectColor : item.color);
      }
    }
  }

  private _inspectNextItems(item: IItem): void {
    if (item._hasNextItems) {

    }
  }

  private _findEventStart(event: IItem): number {

    const initDate: Moment = moment(this.inputOptions.range.from);

    const myDateFrom: Moment = moment(event.date.from);

    if (myDateFrom.diff(initDate, 'minutes') <= 0) {
      return 0;
    }

    return (this.cellWidth * myDateFrom.diff(initDate, 'minutes')) / (this.inputOptions.viewScale);
  }

  private _findEventDuration(event: IItem): number {

    let myDateFrom: Moment = moment(event.date.from);
    const myDateTo: Moment = moment(event.date.to);

    if (moment(this.inputOptions.range.from) > myDateFrom) {
      myDateFrom = moment(this.inputOptions.range.from);
    }

    if (myDateTo.diff(myDateFrom, 'minutes') <= 0) {
      return 0;
    }

    return (this.cellWidth * (myDateTo.diff(myDateFrom, 'minutes'))) / (this.inputOptions.viewScale);
  }

  private _inspectInputOptions(): void {
    this.editScale = this.inputOptions.editScale;
    this.viewScale = this.inputOptions.viewScale;
    this.fromRange = this.inputOptions.range.from;
    this.toRange = this.inputOptions.range.to;
  }

  private _initProjectsKeys(): void {
    this.itemsKeys = [];

    for (const projKey of Object.keys(this.items)) {
      this.itemsKeys.push(projKey);
    }
  }

  public viewScaleChanged(value: number): void {
    this.inputOptions.viewScale = value;
    this.viewScale = this.inputOptions.viewScale;
    this.initInspectItems();
  }

  public editScaleChanged(value: number): void {
    this.inputOptions.editScale = value;
    this.editScale = this.inputOptions.editScale;
    this.initInspectItems();
  }

  public fromRangeChanged(value: Date): void {
    this.inputOptions.range.from = value;
    this.fromRange = this.inputOptions.range.from;
    this.initInspectItems();
  }

  public toRangeChanged(value: Date): void {
    this.inputOptions.range.to = value;
    this.toRange = this.inputOptions.range.to;
    this.initInspectItems();
  }

  public scrollPositionChanged(value: number): void {
    this.scrollPosition = value;
  }

  public itemDraggedOrCollapsedEvtFired(value: boolean): void {
    this.itemDraggedOrCollapsedEvt = value;
  }

  public itemMovedEvt(): void {
    this.initInspectItems();
  }
}
