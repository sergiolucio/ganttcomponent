import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EScaleStates, IProject} from './gantt.component.interface';
import * as $ from 'jquery';
import {Observable} from 'rxjs';
import {GanttUtilsService} from '../../services/gantt.utils.service';

@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrls: ['./gantt.component.scss']
})
export class GanttComponent implements OnInit {
  @Input() scaleState: EScaleStates;
  @Input() hourScaleSelected: number;

  @Input() minRangeSelected: Date;
  @Output() minRangeSelectedChange: EventEmitter<Date>;
  @Input() maxRangeSelected: Date;
  @Output() maxRangeSelectedChange: EventEmitter<Date>;

  private _projects: Array<IProject>;

  public tasksParentWidth: number;
  public tasksDescWidth: number;
  public tasksWidth: number;
  public tasksDivisionWidth: number;
  public grabber: boolean;
  public oldX: number;

  constructor(
    private _ganttUtilsService: GanttUtilsService
  ) {
    this.minRangeSelectedChange = new EventEmitter<Date>();
    this.maxRangeSelectedChange = new EventEmitter<Date>();
  }

  ngOnInit() {
    this.tasksParentWidth = $('div.row.tables-container').width();
    this.tasksDescWidth = this.tasksParentWidth * 0.285;
    this.tasksWidth = this.tasksParentWidth * 0.7;
    this.tasksDivisionWidth = this.tasksParentWidth * 0.005;
    this.grabber = false;

    this._projects = this._ganttUtilsService.generateProjects();
  }

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

  public toggleTasksDescription(): void {
    let myTasksDescBorder: number;

    if (this.tasksDescWidth > 0) {
      this.tasksDescWidth = 0;
      myTasksDescBorder = 0;
      this.tasksWidth = this.tasksParentWidth * 0.985;
      $('div.tasks-division').hide();
    } else {
      this.tasksDescWidth = this.tasksParentWidth * 0.285;
      myTasksDescBorder = 0.5;
      this.tasksWidth = this.tasksParentWidth * 0.7;
      $('div.tasks-division').show();
    }

    $('div.tasks-description-container').css({
      border: myTasksDescBorder + 'px'
    });

    $('div.tasks-description-toggle').toggleClass('active');
  }


  public getProjects(): Observable<Array<IProject>> {
    return new Observable<Array<IProject>>(observer => {
      observer.next(this._projects);
    });
  }

  public minRangeSelectedChanged(value: Date): void {
    this.minRangeSelected = value;
    this.minRangeSelectedChange.emit(value);
  }

  public maxRangeSelectedChanged(value: Date): void {
    this.maxRangeSelected = value;
    this.maxRangeSelectedChange.emit(value);
  }
}
