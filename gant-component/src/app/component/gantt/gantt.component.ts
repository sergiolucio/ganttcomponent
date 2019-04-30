import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {EScaleStates, IInputOptions, IItem, IItems} from './gantt.component.interface';
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

  constructor() {
  }

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
      this._initItemsKeys();
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
      this._initItemsKeys();
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
      this._inspectLinks(this.items[projKey]);
    }
  }

  private _inspectItems(item: IItem, mainProjectColor?: string): void {
    this.itemsCounter++; // contador de items totais
    this._subItemsByItem++; // contador de items por projeto

    item._orderNumber = this.itemsCounter;
    item._hasChildren = !!item.itemsChildren && Object.keys(item.itemsChildren).length > 0;
    item._hasPrevious = false;
    item._hasLinks = !!item.links && Object.keys(item.links).length > 0;
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

  private _inspectLinks(previousItem: IItem): void {
    if (previousItem._hasLinks && previousItem.links.length > 0) {

      for (const link of previousItem.links) {
        link.style = {};
        let myTargetFounded = false;

        const findTarget = (nextItem) => {
          if (!myTargetFounded) {
            if (link.data === nextItem) {
              myTargetFounded = true;

              nextItem._hasPrevious = true;

              let minDate: Date;
              let maxDate: Date;

              if (previousItem.date.from < nextItem.date.from) {
                minDate = previousItem.date.from;
                link.style['margin-left'] = `${Number(previousItem._detailsStyle['margin-left'].replace('px', '')) - 30}px`;
              } else {
                minDate = nextItem.date.from;
                link.style['margin-left'] = `${Number(nextItem._detailsStyle['margin-left'].replace('px', '')) - 30}px`;
              }

              if (previousItem.date.to < nextItem.date.to) {
                maxDate = nextItem.date.to;
              } else {
                maxDate = previousItem.date.to;
              }

              let minDateMoment: Moment = moment(minDate);
              const maxDateMoment: Moment = moment(maxDate);

              if (moment(this.inputOptions.range.from) > minDateMoment) {
                minDateMoment = moment(this.inputOptions.range.from);
              }

              if (maxDateMoment.diff(minDateMoment, 'minutes') <= 0) {
                link.style['width'] = '0';
              } else {
                link.style['width'] =
                  `${((this.cellWidth * (maxDateMoment.diff(minDateMoment, 'minutes'))) / (this.inputOptions.viewScale)) + 60}`;
              }


              let myWidth: number;

              if (previousItem.date.from < nextItem.date.from) {
                myWidth = Number(previousItem._detailsStyle['width'].replace('px', ''));
              } else {
                myWidth =
                  Number(previousItem._detailsStyle['width'].replace('px', '')) +
                  (Number(previousItem._detailsStyle['margin-left'].replace('px', '')) -
                  Number(nextItem._detailsStyle['margin-left'].replace('px', '')));
              }

              let myThirdPathEnd: number;

              if (previousItem._orderNumber > nextItem._orderNumber) {
                // TODO qd o next item estiver acima do de origem
                const myHeight: number = previousItem._orderNumber - nextItem._orderNumber;
                link.style['height'] = `${(myHeight + 1) * 32}`;
                link.style['top'] = `-${(myHeight) * 32}`;
                link.style['first-path'] = `M${myWidth + 35} ${(myHeight + 1) * 32 - 24} H${myWidth + 55}`;
                link.style['second-path'] = `M${myWidth + 55} ${(myHeight + 1) * 32 - 24} V${(myHeight) * 32 - 8}`;

                if (previousItem.date.from < nextItem.date.from) {
                  myThirdPathEnd =
                    Number(nextItem._detailsStyle['margin-left'].replace('px', '')) -
                    Number(previousItem._detailsStyle['margin-left'].replace('px', ''));

                } else {
                  myThirdPathEnd = 0;

                }
                link.style['third-path'] = `M${myWidth + 55} ${(myHeight) * 32 - 8} H${myThirdPathEnd + 5}`;
                link.style['fourth-path'] = `M${myThirdPathEnd + 5} ${(myHeight) * 32 - 8} V8`;
                link.style['fifth-path'] = `M${myThirdPathEnd + 5} 8 H${myThirdPathEnd + 15}`;

              } else {

                link.style['top'] = '0';
                link.style['height'] = `${(nextItem._orderNumber - previousItem._orderNumber + 1) * 32}`;

                if (previousItem.date.from < nextItem.date.from) {
                  myThirdPathEnd =
                    Number(nextItem._detailsStyle['margin-left'].replace('px', '')) -
                    Number(previousItem._detailsStyle['margin-left'].replace('px', ''));

                } else {
                  myThirdPathEnd = 0;

                }
                link.style['first-path'] = `M${myWidth + 35} 8 H${myWidth + 55}`;
                link.style['second-path'] = `M${myWidth + 55} 8 V24`;
                link.style['third-path'] = `M${myWidth + 55} 24 H${myThirdPathEnd + 5}`;

                const myFourthPathEnd: number = Number(link.style['height']) - 16 - 8;
                link.style['fourth-path'] = `M${myThirdPathEnd + 5} 24 V${myFourthPathEnd}`;

                link.style['fifth-path'] = `M${myThirdPathEnd + 5} ${myFourthPathEnd} H${myThirdPathEnd + 15}`;
              }


            } else if (nextItem._hasChildren) {
              for (const childKey of Object.keys(nextItem.itemsChildren)) {
                findTarget(nextItem.itemsChildren[childKey]);
              }
            }
          } else {
            return;
          }
        };

        for (const itemKey of Object.keys(this.items)) {
          findTarget(this.items[itemKey]);
        }
      }
    }

    if (previousItem._hasChildren) {
      for (const childKey of Object.keys(previousItem.itemsChildren)) {
        this._inspectLinks(previousItem.itemsChildren[childKey]);
      }
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

  private _initItemsKeys(): void {
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
