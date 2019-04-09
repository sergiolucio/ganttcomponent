import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {EScaleStates, IProject, IProjects, ITask} from './gantt.component.interface';
import {Observable} from 'rxjs';
import {GanttUtilsService} from '../../services/gantt.utils.service';
import * as moment from 'moment';
import {Moment} from 'moment';

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

  private _projects: IProjects;
  private _projectsCount: number;

  public tasksParentWidth: number;
  public tasksDescWidth: number;
  public tasksWidth: number;
  public tasksDivisionWidth: number;
  public grabber: boolean;
  public oldX: number;

  public scrollPosition: number;

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

    this._projectsCount = 0;
    this._projects = this._ganttUtilsService.generateProjects();
    if (this._projects) {
      for (const projKey of Object.keys(this._projects)) {
        this._inspectProjects(this._projects[projKey]);
      }
    }

    if (!this.scrollPosition) {
      this.scrollPosition = 0;
    }

    console.log(this._projectsCount);
    console.log(this._projects);
  }

  // ======== código da barra separadora das tabelas - resizable
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

  // ============================================================

  // ======== código do botão para esconder / mostrar o painel esquerdo de descrição das tabelas
  public toggleTasksDescription(): void {
    let myTasksDescBorder: number;
    const myTaskDivision = document.querySelector('div.tasks-division') as HTMLElement;

    if (this.tasksDescWidth > 0) {
      this.tasksDescWidth = 0;
      myTasksDescBorder = 0;
      this.tasksWidth = this.tasksParentWidth * 0.985;
      myTaskDivision.style.display = 'none';
    } else {
      this.tasksDescWidth = this.tasksParentWidth * 0.285;
      myTasksDescBorder = 0.5;
      this.tasksWidth = this.tasksParentWidth * 0.7;
      myTaskDivision.style.display = 'block';
    }

    const myTaskDescriptionContainer = document.querySelector('div.tasks-description-container') as HTMLElement;
    myTaskDescriptionContainer.style.border = myTasksDescBorder + 'px';

    const myTaskDescriptionToggle = document.querySelector('div.tasks-description-toggle');
    myTaskDescriptionToggle.classList.toggle('active');
  }

  // ============================================================

  public getProjects(): Observable<IProjects> {
    return new Observable<IProjects>(observer => {
      observer.next(this._projects);
    });
  }

  private _inspectProjects(project: IProject, mainProjectColor?: string): void {
    this._projectsCount++; // só para imprimir na consola o número de items carregados

    project._hasTasks = project.tasks && Object.keys(project.tasks).length > 0;
    project._hasChildren = project.projectChildren && Object.keys(project.projectChildren).length > 0;
    project._descriptionStyle = {};
    project._descriptionStyle['border-left'] = mainProjectColor ? '3px solid ' + mainProjectColor : '3px solid ' + project.color;
    project._descriptionStyle['padding-left'] = project.genealogyDegree * 15 + 'px';
    project._projectStartPosition = this._findEventStart(project);
    project._projectDurationWidth = this._findEventDuration(project);

    if (project._hasTasks) {
      for (const taskKey of Object.keys(project.tasks)) {
        this._projectsCount++; // só para imprimir na consola o número de items carregados

        project.tasks[taskKey]._descriptionStyle = {};
        project.tasks[taskKey]._descriptionStyle['border-left'] =
          mainProjectColor ? '3px solid ' + mainProjectColor : '3px solid ' + project.color;
        project.tasks[taskKey]._descriptionStyle['padding-left'] = project.tasks[taskKey].genealogyDegree * 15 + 'px';
        project.tasks[taskKey]._taskStartPosition = this._findEventStart(project.tasks[taskKey]);
        project.tasks[taskKey]._taskDurationWidth = this._findEventDuration(project.tasks[taskKey]);
      }
    }

    if (project._hasChildren) {
      for (const projKey of Object.keys(project.projectChildren)) {
        this._inspectProjects(project.projectChildren[projKey], mainProjectColor ? mainProjectColor : project.color);
      }
    }
  }

  private _findEventStart(event: IProject | ITask): number {

    let myScaleHour: Date;

    const resetDate: string = moment(event.date.from).format('DD-MM-YYYY');

    for (
      const i = moment(resetDate + ' 00:00', 'DD-MM-YYYY HH:mm');
      i < moment(resetDate + ' 24:00', 'DD-MM-YYYY HH:mm');
      i.add(this.hourScaleSelected, 'hours')
    ) {
      if (i >= moment(event.date.from, 'HH:mm')) {
        if (!myScaleHour) {
          myScaleHour = i.toDate();
        }
        break;
      }

      myScaleHour = i.toDate();
    }

    const myDateFrom: Moment = moment(event.date.from);

    console.log(myDateFrom.diff(myScaleHour, 'minutes'));
    return (50 * myDateFrom.diff(myScaleHour, 'minutes')) / (this.hourScaleSelected * 60);
  }

  private _findEventDuration(event: IProject | ITask): number {

    const myDateFrom: Moment = moment(event.date.from);
    const myDateTo: Moment = moment(event.date.to);

    return (50 * (myDateTo.diff(myDateFrom, 'minutes') + 60)) / (this.hourScaleSelected * 60);
  }


  public minRangeSelectedChanged(value: Date): void {
    this.minRangeSelected = value;
    this.minRangeSelectedChange.emit(value);
  }

  public maxRangeSelectedChanged(value: Date): void {
    this.maxRangeSelected = value;
    this.maxRangeSelectedChange.emit(value);
  }

  public scrollPositionChanged(value: number): void {
    this.scrollPosition = value;
  }
}
