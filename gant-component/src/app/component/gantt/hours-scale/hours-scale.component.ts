import {
  ChangeDetectionStrategy,
  Component, ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as moment from 'moment';
import {IProjects} from '../gantt.component.interface';
import {Observable, Subscription} from 'rxjs';
import {Datasource, IDatasource} from 'ngx-ui-scroll';

@Component({
  selector: 'app-hours-scale',
  templateUrl: './hours-scale.component.html',
  styleUrls: ['./hours-scale.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HoursScaleComponent implements OnInit, OnChanges, OnDestroy {

  @Input() projectsObservable: Observable<IProjects>;
  private _subscription: Subscription;
  public projects: IProjects;
  private _projectsKeys: Array<string>;
  public projectsKeysDatasource: Array<string>;

  @Input() minRangeSelected: Date;
  @Output() minRangeSelectedChange: EventEmitter<Date>;
  @Input() maxRangeSelected: Date;
  @Output() maxRangeSelectedChange: EventEmitter<Date>;
  public totalDateRange: Array<Date>;

  @Input() hourScaleSelected: number; // escala em horas
  public scaleRange: Array<Date>;

  @Input() verticalScrollPositionY: number;
  @Output() verticalScrollPositionChange: EventEmitter<number>;
  public verticalScrollPositionX: number;
  private _verticalScrollViewPort: HTMLElement;

  @Input() horizontalScrollContainerWidth: number;
  private _horizontalScrollViewPort: HTMLElement;
  private _horizontalScrollHistory: number; // histórico do scroll para saber se está a aumentar ou diminuir;
  private _excessWidth: number; // excesso em px do que sobre quando renderizamos os items visiveis
  public scrollFreeSpaceLeft: number; // espaço a ser gerado à esquerda do conteúdo vizivel em px;

  @Input() elmtCellWidth: number;
  public dateCellWidth: number;
  public backgroundLayerWidth: number;

  private _verticalScrollHistory: number;
  private _excessHeight: number;
  private _indexMax: number;
  private _indexMin: number;
  private freeSpaceTop: number;

  constructor() {
    this.minRangeSelectedChange = new EventEmitter<Date>();
    this.maxRangeSelectedChange = new EventEmitter<Date>();
    this.verticalScrollPositionChange = new EventEmitter<number>();
  }

  ngOnInit() {

    this._subscription = this.projectsObservable.subscribe( (value: IProjects) => {
      this.projects = value;
    });

    this._projectsKeys = [];
    for (const projKey of Object.keys(this.projects)) {
      this._projectsKeys.push(projKey);
    }

    this.dateCellWidth = (24 / this.hourScaleSelected) * this.elmtCellWidth;

    this._initHorizontalVirtualScroll();

    this.backgroundLayerWidth = this.dateCellWidth * this.totalDateRange.length;

    this._setScaleRange();

    this.scrollFreeSpaceLeft = 0;
    this._horizontalScrollHistory = 0;

    this._initVerticalVirtualScroll();
  }

  ngOnChanges(
    {
      hourScaleSelected,
      minRangeSelected,
      maxRangeSelected,
      verticalScrollPositionY,
      horizontalScrollContainerWidth
    }: SimpleChanges
  ): void {

    if (hourScaleSelected && !hourScaleSelected.isFirstChange()) {
      this._setScaleRange();

      this.dateCellWidth = (24 / this.hourScaleSelected) * this.elmtCellWidth;
      this.scrollFreeSpaceLeft = 0;

      this._initHorizontalVirtualScroll();

      this.backgroundLayerWidth = this.dateCellWidth * this.totalDateRange.length;
    }

    if (minRangeSelected && !minRangeSelected.isFirstChange()) {

      if (moment(minRangeSelected.currentValue).toDate() > this.maxRangeSelected) {

        console.log('Erro - Input minRangeSelected - valor mínimo superior ao máximo no Range de amostragem.');
        this.minRangeSelected = minRangeSelected.previousValue;
        this.minRangeSelectedChange.emit(this.minRangeSelected);

      } else {

        this.minRangeSelected = moment(minRangeSelected.currentValue).toDate();
        this.scrollFreeSpaceLeft = 0;
        this._initHorizontalVirtualScroll();
      }
    }

    if (maxRangeSelected && !maxRangeSelected.isFirstChange()) {

      if (moment(maxRangeSelected.currentValue).toDate() < this.minRangeSelected) {

        console.log('Erro - Input maxRangeSelected - valor máximo inferior ao mínimo no Range de amostragem.');
        this.maxRangeSelected = maxRangeSelected.previousValue;
        this.maxRangeSelectedChange.emit(this.maxRangeSelected);

      } else {

        this.maxRangeSelected = moment(maxRangeSelected.currentValue).toDate();
        this.scrollFreeSpaceLeft = 0;
        this._initHorizontalVirtualScroll();
      }
    }

    if (verticalScrollPositionY && !verticalScrollPositionY.isFirstChange()) {
      document.querySelector('.background-tasks-container').scroll(0, verticalScrollPositionY.currentValue);
    }

    if (horizontalScrollContainerWidth && !horizontalScrollContainerWidth.isFirstChange()) {
      this.scrollFreeSpaceLeft = 0;
      this._initHorizontalVirtualScroll();
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._dettachHorizontalScrollEvent();
    this._dettachVerticalScrollEvent();
  }

  private _initHorizontalVirtualScroll(): void {
    const myScrollContainerWidth: number = this.horizontalScrollContainerWidth;
    let myRenderedWidth = 0;
    const date = moment(this.minRangeSelected);

    this.totalDateRange = [];

    while (myRenderedWidth < myScrollContainerWidth) {
      this.totalDateRange.push(date.toDate());
      date.add(1, 'days');
      myRenderedWidth += this.dateCellWidth;
    }

    this.totalDateRange.push(date.toDate());

    if (this.hourScaleSelected > 0.25) {
      // código para acrescentar mais dois dias de buffer - buffer mínimo = 2
      date.add(1, 'days');
      this.totalDateRange.push(date.toDate());
    }

    this._excessWidth = myRenderedWidth - myScrollContainerWidth;
    document.querySelector('#tasks-content').scroll(0, 0);
  }

  private _initVerticalVirtualScroll() {

    const myScrollViewPortHeight: number = document.querySelector('.background-tasks-container').clientHeight;
    // const myRowHeight: number = document.querySelector('.scroll-viewport .row').clientHeight;

    let myRenderedHeight = 0;

    this.projectsKeysDatasource = [];

    let i: number;
    for (i = 0; myRenderedHeight < myScrollViewPortHeight; i++) {
      this.projectsKeysDatasource.push(this._projectsKeys[i]);

      myRenderedHeight += this.projects[this._projectsKeys[i]]._projectItems * 32;
      // _projectItems tem o nº total de items por project; 32 é o nº de px por row
    }

    this.projectsKeysDatasource.push(this._projectsKeys[i]);
    i++;
    this.projectsKeysDatasource.push(this._projectsKeys[i]);


    this._indexMin = 0;
    this._indexMax = this.projectsKeysDatasource.length - 1;
    this.freeSpaceTop = 0;
    this._excessHeight = myRenderedHeight - myScrollViewPortHeight;

    document.querySelector('.scroll-viewport').scroll(0, 0);
  }

  @ViewChild('horizontalScrollViewPort')
  public set horizontalScrollViewPort(value: ElementRef<HTMLElement>) {
    this._horizontalScrollViewPort = value ? value.nativeElement : undefined;
    this._attachHorizontalScrollEvent();
  }

  public fnHorizontalScrollEventHandler = (event: Event) => this._horizontalScrollEventHandler(event);

  private _attachHorizontalScrollEvent(): void {
    if (this._horizontalScrollViewPort) {
      this._horizontalScrollViewPort.addEventListener<'scroll'>('scroll', this.fnHorizontalScrollEventHandler, {passive: true});
    }
  }

  private _dettachHorizontalScrollEvent(): void {
    if (this._horizontalScrollViewPort) {
      this._horizontalScrollViewPort.removeEventListener<'scroll'>('scroll', this.fnHorizontalScrollEventHandler);
    }
  }

  private _horizontalScrollEventHandler(event: Event): void {
    const myScrollLeft = (event.target as HTMLElement).scrollLeft;
    const myScrollWidth = (event.target as HTMLElement).scrollWidth;

    this.verticalScrollPositionX = myScrollLeft;

    if (this._horizontalScrollHistory < myScrollLeft) { // condição que verifica que o scroll está a crescer -> direita

      if (
        myScrollLeft > (2 * this.horizontalScrollContainerWidth) / 3 &&
        (myScrollWidth - myScrollLeft - this.horizontalScrollContainerWidth) < (2 * this.horizontalScrollContainerWidth) / 3 &&
        this.totalDateRange[this.totalDateRange.length - 1] < this.maxRangeSelected
      ) {
        this.totalDateRange.push(moment(this.totalDateRange[this.totalDateRange.length - 1]).add(1, 'days').toDate());
        this.totalDateRange.shift();
        this.scrollFreeSpaceLeft += this.dateCellWidth;
      }
    } else { // scroll a diminuir -> esquerda

      if (
        myScrollLeft > (2 * this.horizontalScrollContainerWidth) / 3 &&
        (myScrollWidth - myScrollLeft - this.horizontalScrollContainerWidth) > (2 * this.horizontalScrollContainerWidth) / 3 &&
        this.totalDateRange[0] > this.minRangeSelected
      ) {
        this.totalDateRange.unshift(moment(this.totalDateRange[0]).subtract(1, 'days').toDate());
        this.totalDateRange.pop();
        this.scrollFreeSpaceLeft -= this.dateCellWidth;
      }
    }

    this._horizontalScrollHistory = myScrollLeft;
  }

  @ViewChild('verticalScrollViewPort')
  public set verticalScrollViewPort(value: ElementRef<HTMLElement>) {
    this._verticalScrollViewPort = value ? value.nativeElement : undefined;
    this._attachVerticalScrollEvent();
  }

  public fnVerticalScrollEventHandler = (event: Event) => this._verticalScrollEventHandler(event);

  private _verticalScrollEventHandler(event: Event) {

    const myScrollTop: number = (event.target as HTMLElement).scrollTop;
    const myScrollHeight: number = (event.target as HTMLElement).scrollHeight;
    const myScrollViewPortHeight: number = this._verticalScrollViewPort.clientHeight;


    this.verticalScrollPositionY = myScrollTop;
    this.verticalScrollPositionChange.emit(myScrollTop);

    // verificar se o scroll esta a subir ou a descer
    if (this._verticalScrollHistory < myScrollTop) {
      this._verticalScrollHistory = myScrollTop;

      if (
        myScrollTop > this._excessHeight + this.projects[this.projectsKeysDatasource[0]]._projectItems * 32 &&
        (myScrollHeight - myScrollTop - myScrollViewPortHeight) <
        this._excessHeight +
        this.projects[this.projectsKeysDatasource[this.projectsKeysDatasource.length - 1]]._projectItems * 32 &&
        this.projectsKeysDatasource[this.projectsKeysDatasource.length - 1] !== this._projectsKeys[this._projectsKeys.length - 1]
      ) {
        this._indexMax++;
        this._indexMin++;
        this.projectsKeysDatasource.push(this._projectsKeys[this._indexMax]);
        this.freeSpaceTop += this.projects[this.projectsKeysDatasource[0]]._projectItems * 32;
        this.projectsKeysDatasource.shift();
      }

    } else {
      this._verticalScrollHistory = myScrollTop;

      if (
        myScrollTop > this.projects[this.projectsKeysDatasource[0]]._projectItems * 32 &&
        (myScrollHeight - myScrollTop - myScrollViewPortHeight) > this.projects[this.projectsKeysDatasource[this.projectsKeysDatasource.length - 1]]._projectItems * 32 &&
        this.projectsKeysDatasource[0] !== this._projectsKeys[0]
      ) {
        this._indexMax--;
        this._indexMin--;
        this.projectsKeysDatasource.unshift(this._projectsKeys[this._indexMin]);
        this.freeSpaceTop -= this.projects[this.projectsKeysDatasource[0]]._projectItems * 32;
        this.projectsKeysDatasource.pop();
      }

    }
  }

  private _attachVerticalScrollEvent(): void {
    if (this._verticalScrollViewPort) {
      this._verticalScrollViewPort.addEventListener<'scroll'>('scroll', this.fnVerticalScrollEventHandler, {passive: true});
    }
  }

  private _dettachVerticalScrollEvent(): void {
    if (this._verticalScrollViewPort) {
      this._verticalScrollViewPort.removeEventListener<'scroll'>('scroll', this.fnVerticalScrollEventHandler);
    }
  }

  private _setScaleRange(): void {
    this.scaleRange = [];

    for (const i = moment('00:00', 'HH:mm'); i < moment('24:00', 'HH:mm'); i.add(this.hourScaleSelected, 'hours')) {
      this.scaleRange.push(i.toDate());
    }
  }
}
