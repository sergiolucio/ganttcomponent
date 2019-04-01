import { Component, OnInit } from '@angular/core';
import {IProject} from '../../component/gantt/gantt.component.interface';
import {GanttUtilsService} from '../../services/gantt.utils.service';

@Component({
  selector: 'app-three-hours-scale-state',
  templateUrl: './three-hours-scale-state.component.html',
  styleUrls: ['./three-hours-scale-state.component.scss']
})
export class ThreeHoursScaleStateComponent implements OnInit {

  public projects: Array<IProject>;

  constructor(
    private _ganttUtilsService: GanttUtilsService
  ) { }

  ngOnInit() {
    this.projects = this._ganttUtilsService.generateProject();
  }

}
