import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
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
  public projectsKeys: Array<string>;
  public projectsKeysDataSource: IDatasource;
  @Input() itemsNumber: number; // recebe o nº total de projetos e tarefas

  @Input() minRangeSelected: Date;
  @Output() minRangeSelectedChange: EventEmitter<Date>;
  @Input() maxRangeSelected: Date;
  @Output() maxRangeSelectedChange: EventEmitter<Date>;
  public totalDateRange: Array<Date>;
  public dateRangeDataSource: IDatasource;

  @Input() hourScaleSelected: number; // escala em horas
  public scaleRange: Array<Date>;

  @Input() elmtCellWidth: number;
  public dateCellWidth: number;
  public backgroundLayerWidth: number;

  constructor() {
    this.minRangeSelectedChange = new EventEmitter<Date>();
    this.maxRangeSelectedChange = new EventEmitter<Date>();
  }

  ngOnInit() {

    this._subscription = this.projectsObservable.subscribe( (value: IProjects) => {
      this.projects = value;
    });

    this.projectsKeys = [];
    for (const projKey of Object.keys(this.projects)) {
      this.projectsKeys.push(projKey);
    }

    this.projectsKeysDataSource = new Datasource({
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
        bufferSize: 2,
        startIndex: 0
      }
    });

    this.totalDateRange = [];

    for (const date = moment(this.minRangeSelected); date <= moment(this.maxRangeSelected); date.add(1, 'days')) {
      this.totalDateRange.push(date.toDate());
    }

    this.dateRangeDataSource = new Datasource({
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
        bufferSize: 2,
        startIndex: 0
      }
    });

    this.scaleRange = [];

    for (const i = moment('00:00', 'HH:mm'); i < moment('24:00', 'HH:mm'); i.add(this.hourScaleSelected, 'hours')) {
      this.scaleRange.push(i.toDate());
    }

    this.dateCellWidth = (24 / this.hourScaleSelected) * this.elmtCellWidth;
    this.backgroundLayerWidth = this.dateCellWidth * this.totalDateRange.length;
  }

  ngOnChanges({hourScaleSelected, minRangeSelected, maxRangeSelected, scrollPosition}: SimpleChanges): void {

    if (hourScaleSelected && !hourScaleSelected.isFirstChange()) {
      this.scaleRange = [];

      for (const i = moment('00:00', 'HH:mm'); i < moment('24:00', 'HH:mm'); i.add(this.hourScaleSelected, 'hours')) {
        this.scaleRange.push(i.toDate());
      }
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


  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }


}
