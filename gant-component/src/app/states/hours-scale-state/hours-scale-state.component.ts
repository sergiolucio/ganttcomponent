import {Component, OnInit} from '@angular/core';
import * as moment from 'moment';
import {IInputOptions} from '../../component/gantt/gantt.component.interface';
import {Observable} from 'rxjs';
import {GanttUtilsService} from '../../services/gantt.utils.service';

@Component({
  selector: 'app-hours-scale-state',
  templateUrl: './hours-scale-state.component.html',
  styleUrls: ['./hours-scale-state.component.scss']
})
export class HoursScaleStateComponent implements OnInit {

  public inputOptions: IInputOptions;

  constructor(
    private _ganttUtilsService: GanttUtilsService
  ) {}

  ngOnInit() {
    this.inputOptions = this._ganttUtilsService.generateInputOptions();
  }
}
