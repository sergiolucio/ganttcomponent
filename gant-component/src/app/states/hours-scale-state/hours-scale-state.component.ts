import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-hours-scale-state',
  templateUrl: './hours-scale-state.component.html',
  styleUrls: ['./hours-scale-state.component.scss']
})
export class HoursScaleStateComponent implements OnInit {

  public hourScaleSelected: number;
  public minRangeSelected: Date;
  public maxRangeSelected: Date;

  constructor(
  ) { }

  ngOnInit() {
    this.hourScaleSelected = 3;
    this.minRangeSelected = moment().subtract(5, 'days').toDate();
    this.maxRangeSelected = moment().add(5, 'days').toDate();
  }

}
