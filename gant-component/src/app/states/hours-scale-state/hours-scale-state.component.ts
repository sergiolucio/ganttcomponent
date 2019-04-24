import {Component, OnInit} from '@angular/core';
import {IInputOptions, IItems} from '../../component/gantt/gantt.component.interface';
import {GanttUtilsService} from '../../services/gantt.utils.service';

@Component({
  selector: 'app-hours-scale-state',
  templateUrl: './hours-scale-state.component.html',
  styleUrls: ['./hours-scale-state.component.scss']
})
export class HoursScaleStateComponent implements OnInit {

  public inputOptions: IInputOptions;
  public projects: IItems;
  public inputPanelOptionsActive: boolean;
  public timePickerActive: boolean;
  public datePickerActive: boolean;

  constructor(
    private _ganttUtilsService: GanttUtilsService
  ) {
  }

  ngOnInit() {
    this.inputOptions = this._ganttUtilsService.generateInputOptions();
    this.projects = this._ganttUtilsService.generateProjects();
    this.inputPanelOptionsActive = true;
    this.timePickerActive = true;
    this.datePickerActive = true;
  }
}
