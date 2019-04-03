import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import * as moment from 'moment';
import {IProject, ITasks} from '../gantt.component.interface';
import {GanttUtilsService} from '../../../services/gantt.utils.service';
import {Observable, Subscription} from 'rxjs';
import {Moment} from 'moment';

@Component({
  selector: 'app-hours-scale',
  templateUrl: './hours-scale.component.html',
  styleUrls: ['./hours-scale.component.scss']
})
export class HoursScaleComponent implements OnInit, OnChanges, OnDestroy {

  @Input() projectsObservable: Observable<Array<IProject>>;
  private _subscription: Subscription;
  public projects: Array<IProject>;

  @Input() minRangeSelected: Date;
  @Output() minRangeSelectedChange: EventEmitter<Date>;
  @Input() maxRangeSelected: Date;
  @Output() maxRangeSelectedChange: EventEmitter<Date>;
  public totalDateRange: Array<Date>;

  @Input() hourScaleSelected: number; // escala em horas
  public scaleRange: Array<Date>;

  public elmtCellWidth: number;

  constructor() {
    this.minRangeSelectedChange = new EventEmitter<Date>();
    this.maxRangeSelectedChange = new EventEmitter<Date>();

    this.elmtCellWidth = 70;
  }

  ngOnInit() {

    this.totalDateRange = [];

    for (const date = moment(this.minRangeSelected); date <= moment(this.maxRangeSelected); date.add(1, 'days')) {
      this.totalDateRange.push(date.toDate());
    }

    this.scaleRange = [];


    for (const i = moment('00:00', 'HH:mm'); i < moment('24:00', 'HH:mm'); i.add(this.hourScaleSelected, 'hours') ) {
      this.scaleRange.push(i.toDate());
    }

    this._subscription = this.projectsObservable.subscribe((value: Array<IProject>) => {
      this.projects = value;
    });
  }

  ngOnChanges({ hourScaleSelected, minRangeSelected, maxRangeSelected }: SimpleChanges): void {

    if (hourScaleSelected && !hourScaleSelected.isFirstChange()) {
      this.scaleRange = [];

      for (const i = moment('00:00', 'HH:mm'); i < moment('24:00', 'HH:mm'); i.add(this.hourScaleSelected, 'hours') ) {
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

  public findEventDuration(event: IProject | ITasks): number {
    const dateFrom: Moment = moment(event.date.from);
    const dateTo: Moment = moment(event.date.to);

    return dateTo.diff(dateFrom, 'hours') + 1;
  }
}
