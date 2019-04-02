import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import * as moment from 'moment';
import {IProject} from '../gantt.component.interface';
import {GanttUtilsService} from '../../../services/gantt.utils.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-hours-scale',
  templateUrl: './hours-scale.component.html',
  styleUrls: ['./hours-scale.component.scss']
})
export class HoursScaleComponent implements OnInit, OnChanges {

  @Input() toggleRowVisibility: string;

  @Input() projectsObservable: Observable<Array<IProject>>;
  public projects: Array<IProject>;

  @Input() minRangeSelected: Date;
  @Output() minRangeSelectedChange: EventEmitter<Date>;
  @Input() maxRangeSelected: Date;
  @Output() maxRangeSelectedChange: EventEmitter<Date>;
  public totalDateRange: Array<Date>;

  @Input() hourScaleSelected: number; // escala em horas
  public scaleRange: Array<number>;

  constructor() {
    this.minRangeSelectedChange = new EventEmitter<Date>();
    this.maxRangeSelectedChange = new EventEmitter<Date>();
  }

  ngOnInit() {

    this.totalDateRange = [];

    for (const date = moment(this.minRangeSelected); date <= moment(this.maxRangeSelected); date.add(1, 'days')) {
      this.totalDateRange.push(date.toDate());
    }

    this.scaleRange = [];

    for (let i = 0; i < 24; i = i + this.hourScaleSelected) {
      this.scaleRange.push(i);
    }

    this.projectsObservable.subscribe((value: Array<IProject>) => {
      this.projects = value;
    });
  }

  ngOnChanges({ hourScaleSelected, minRangeSelected, maxRangeSelected }: SimpleChanges): void {

    if (hourScaleSelected && !hourScaleSelected.isFirstChange()) {
      this.scaleRange = [];

      for (let i = 0; i < 24; i = i + this.hourScaleSelected) {
        this.scaleRange.push(i);
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


}
