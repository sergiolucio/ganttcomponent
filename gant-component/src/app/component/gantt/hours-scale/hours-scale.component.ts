import {
  ChangeDetectionStrategy,
  Component, ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output, QueryList,
  SimpleChanges, ViewChild, ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import * as moment from 'moment';
import {Moment} from 'moment';
import {IProject, IProjects, ITask} from '../gantt.component.interface';
import {Observable, Subscription} from 'rxjs';
import * as $ from 'jquery';
import {Datasource, IDatasource} from 'ngx-ui-scroll';
import {element} from 'protractor';

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
  public projectsKeys: Array<string>;
  public projectDataSource: IDatasource;

  @Input() minRangeSelected: Date;
  @Output() minRangeSelectedChange: EventEmitter<Date>;
  @Input() maxRangeSelected: Date;
  @Output() maxRangeSelectedChange: EventEmitter<Date>;
  public totalDateRange: Array<Date>;
  public dateRangeDataSource: IDatasource;

  @Input() hourScaleSelected: number; // escala em horas
  public scaleRange: Array<Date>;

  public elmtCellWidth: number;
  public itemSize: number;
  public itemsNumber: number;

  @Input() scrollPosition: number;
  @Output() scrollPositionChange: EventEmitter<number>;
  private _verticalScrollViewport: QueryList<'verticalScrollViewport'>;

  constructor() {
    this.minRangeSelectedChange = new EventEmitter<Date>();
    this.maxRangeSelectedChange = new EventEmitter<Date>();
    this.scrollPositionChange = new EventEmitter<number>();
  }

  ngOnInit() {

    this._subscription = this.projectsObservable.subscribe( (value: IProjects) => {
      this.projects = value;
    });

    this.projectsKeys = [];
    for (const projKey of Object.keys(this.projects)) {
      this.projectsKeys.push(projKey);
    }

    this.projectDataSource = new Datasource({
      get: (index, count, success) => {
        const min = 0;
        const max = this.projectsKeys.length - 1;
        const data = [];
        const start = Math.max(min, index);
        const end = Math.min(index + count - 1, max);
        if (start <= end) {
          for (let i = start; i <= end; i++) {
            data.push(this.projectsKeys[i]);
          }
        }
        success(data);
      },
      settings: {
        bufferSize: 1,
        startIndex: 0
      }
    });

    this.totalDateRange = [];

    // provisório para testes
    // this.minRangeSelected = moment('30-03-2019', 'DD-MM-YYYY').toDate();
    // ========================

    for (const date = moment(this.minRangeSelected); date <= moment(this.maxRangeSelected); date.add(1, 'days')) {
      this.totalDateRange.push(date.toDate());
    }

    this.dateRangeDataSource = new Datasource({
      get: (index, count, success) => {
        const min = 0;
        const max = this.totalDateRange.length - 1;
        const data = [];
        const start = Math.max(min, index);
        const end = Math.min(index + count - 1, max);
        if (start <= end) {
          for (let i = start; i <= end; i++) {
            data.push(this.totalDateRange[i]);
          }
        }
        success(data);
      },
      settings: {
        bufferSize: 2,
        startIndex: 0,
        horizontal: true
      }
    });

    this.scaleRange = [];

    for (const i = moment('00:00', 'HH:mm'); i < moment('24:00', 'HH:mm'); i.add(this.hourScaleSelected, 'hours')) {
      this.scaleRange.push(i.toDate());
    }

    this.elmtCellWidth = 50;

    this.itemSize = this.elmtCellWidth * this.scaleRange.length;
    this.itemsNumber = 0;
    // for (const proj of this.projects) {
    //   this._findItemsNumber(proj);
    // }
  }

  ngOnChanges({hourScaleSelected, minRangeSelected, maxRangeSelected, scrollPosition}: SimpleChanges): void {

    if (hourScaleSelected && !hourScaleSelected.isFirstChange()) {
      this.scaleRange = [];

      for (const i = moment('00:00', 'HH:mm'); i < moment('24:00', 'HH:mm'); i.add(this.hourScaleSelected, 'hours')) {
        this.scaleRange.push(i.toDate());
      }

      this.itemSize = this.elmtCellWidth * this.scaleRange.length;
    }

    if (minRangeSelected && !minRangeSelected.isFirstChange()) {


      if (moment(minRangeSelected.currentValue).toDate() > this.maxRangeSelected) {

        console.log('Erro - Input minRangeSelected - valor mínimo superior ao máximo no Range de amostragem.');
        this.minRangeSelected = minRangeSelected.previousValue;
        this.minRangeSelectedChange.emit(this.minRangeSelected);

      } else {

        this.totalDateRange = [];

        for (const date = moment(this.minRangeSelected); date <= moment(this.maxRangeSelected); date.add(1, 'days')) {
          this.totalDateRange.push(date.toDate());
        }

      }
    }

    if (maxRangeSelected && !maxRangeSelected.isFirstChange()) {

      if (moment(maxRangeSelected.currentValue).toDate() < this.minRangeSelected) {

        console.log('Erro - Input maxRangeSelected - valor máximo inferior ao mínimo no Range de amostragem.');
        this.maxRangeSelected = maxRangeSelected.previousValue;
        this.maxRangeSelectedChange.emit(this.maxRangeSelected);

      } else {

        this.totalDateRange = [];

        for (const date = moment(this.minRangeSelected); date <= moment(this.maxRangeSelected); date.add(1, 'days')) {
          this.totalDateRange.push(date.toDate());
        }
      }
    }

    if (scrollPosition && scrollPosition.currentValue > 0 && !scrollPosition.isFirstChange()) {
      const myScrollViewport = document.querySelectorAll('.vertical-scroll-viewport');

      // @ts-ignore
      for (const item of myScrollViewport) {
        item.scrollTop = this.scrollPosition;
      }
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._dettachScroll();
  }

  @ViewChildren('verticalScrollViewport')
  public set verticalScrollViewport(value: QueryList<'verticalScrollViewport'>) {
    this._verticalScrollViewport = value ? value : undefined;
    this._attachScroll();
  }

  public fnScrollEventHandler = (event: Event) => this._scrollEventHandler(event);

  private _attachScroll(): void {
    if (this._verticalScrollViewport) {
      for (const item of this._verticalScrollViewport.toArray()) {
        (item as unknown as ElementRef<HTMLElement>).nativeElement.addEventListener<'scroll'>('scroll', this.fnScrollEventHandler, {passive: true});
      }
    }
  }

  private _dettachScroll(): void {
    if (this._verticalScrollViewport) {
      for (const item of this._verticalScrollViewport.toArray()) {
        (item as unknown as ElementRef<HTMLElement>).nativeElement.removeEventListener<'scroll'>('scroll', this.fnScrollEventHandler);
      }
    }
  }

  private _scrollEventHandler(event: Event): void {
    this.scrollPosition = (event.target as HTMLElement).scrollTop;
    this.scrollPositionChange.emit((event.target as HTMLElement).scrollTop);

    const myScrollViewport = document.querySelectorAll('.vertical-scroll-viewport');
    // @ts-ignore
    for (const item of myScrollViewport) {
      item.scrollTop = this.scrollPosition;
    }
  }
}
