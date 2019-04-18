import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {EScaleStates, IInputOptions, IProject, IProjects, ITask} from './gantt.component.interface';
import {Observable, Subscription} from 'rxjs';
import {GanttUtilsService} from '../../services/gantt.utils.service';
import * as moment from 'moment';
import {Moment} from 'moment';

@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrls: ['./gantt.component.scss']
})
export class GanttComponent implements OnInit, OnChanges {
  // inputs recebidos do painel de opções
  @Input() inputOptions: IInputOptions;
  public viewScale: number;
  public editScale: number;
  public fromRange: Date;
  public toRange: Date;

  @Input() scaleState: EScaleStates;

  private _projects: IProjects;
  public projectsCounter: number;
  public itemDraggedOrCollapsedEvt: boolean;

  // variáveis de configuração de dimensões do layout
  public tasksParentWidth: number;
  public tasksDescWidth: number;
  public tasksWidth: number;
  public tasksDivisionWidth: number;
  public grabber: boolean;
  public oldX: number;
  public cellWidth: number;

  public scrollPosition: number;
  private _itemsByProject: number;

  constructor(
    private _ganttUtilsService: GanttUtilsService
  ) {}

  ngOnInit() {
    const myTasksParent = document.querySelector('div.row.tables-container');
    this.tasksParentWidth = myTasksParent.clientWidth;
    this.tasksDescWidth = this.tasksParentWidth * 0.285;
    this.tasksWidth = this.tasksParentWidth * 0.7;
    this.tasksDivisionWidth = this.tasksParentWidth * 0.005;
    this.grabber = false;

    this.cellWidth = 50;

    if (this.inputOptions) {
      this._inspectInputOptions();
    }

    this._projects = this._ganttUtilsService.generateProjects();
    if (this._projects) {
      this._initInspectProjects();
    }


    this.itemDraggedOrCollapsedEvt = false;

    if (!this.scrollPosition) {
      this.scrollPosition = 0;
    }

    console.log(this.projectsCounter);
  }

  ngOnChanges({ inputOptions }: SimpleChanges): void {
    if (inputOptions && !inputOptions.isFirstChange()) {
      this._inspectInputOptions();
      this._initInspectProjects();
    }
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

  private _initInspectProjects(): void {
    this.projectsCounter = 0;
    for (const projKey of Object.keys(this._projects)) {
      this._itemsByProject = 0;
      this._inspectProjects(this._projects[projKey]);
      this._projects[projKey]._projectItems = this._itemsByProject;
    }
  }

  private _inspectProjects(project: IProject, mainProjectColor?: string): void {
    this.projectsCounter++; // contador de items totais
    this._itemsByProject++; // contador de items por projeto

    project._hasTasks = project.tasks && Object.keys(project.tasks).length > 0;
    project._hasChildren = project.projectChildren && Object.keys(project.projectChildren).length > 0;
    project._descriptionStyle = {};
    project._descriptionStyle['border-left'] = mainProjectColor ? '3px solid ' + mainProjectColor : '3px solid ' + project.color;
    project._descriptionStyle['padding-left'] = project.genealogyDegree * 15 + 'px';
    project._detailsStyle = {};
    project._detailsStyle['margin-left'] = this._findEventStart(project) + 'px';
    project._detailsStyle['background-color'] = project.color;
    if (this._findEventDuration(project) > 0) {
      project._detailsStyle['width'] = this._findEventDuration(project) + 'px';
      project._detailsStyle['border'] = '1px dimgray solid';
    } else {
      project._detailsStyle['width'] = this._findEventDuration(project) + 'px';
    }

    if (project._hasTasks) {
      for (const taskKey of Object.keys(project.tasks)) {
        this.projectsCounter++; // só para imprimir na consola o número de items carregados
        this._itemsByProject++;

        project.tasks[taskKey]._descriptionStyle = {};
        project.tasks[taskKey]._descriptionStyle['border-left'] =
          mainProjectColor ? '3px solid ' + mainProjectColor : '3px solid ' + project.color;
        project.tasks[taskKey]._descriptionStyle['padding-left'] = project.tasks[taskKey].genealogyDegree * 15 + 'px';
        project.tasks[taskKey]._detailsStyle = {};
        project.tasks[taskKey]._detailsStyle['margin-left'] = this._findEventStart(project.tasks[taskKey]) + 'px';
        project.tasks[taskKey]._detailsStyle['background-color'] = project.tasks[taskKey].color;
        if (this._findEventDuration(project) > 0) {
          project.tasks[taskKey]._detailsStyle['width'] = this._findEventDuration(project.tasks[taskKey]) + 'px';
          project.tasks[taskKey]._detailsStyle['border'] = '1px dimgray solid';
        } else {
          project.tasks[taskKey]._detailsStyle['width'] = this._findEventDuration(project.tasks[taskKey]) + 'px';
        }
      }
    }

    if (project._hasChildren) {
      for (const projKey of Object.keys(project.projectChildren)) {
        this._inspectProjects(project.projectChildren[projKey], mainProjectColor ? mainProjectColor : project.color);
      }
    }
  }

  private _findEventStart(event: IProject | ITask): number {

    const initDate: Moment = moment(this.inputOptions.range.from);

    const myDateFrom: Moment = moment(event.date.from);

    if (myDateFrom.diff(initDate, 'minutes') <= 0) {
      return 0;
    }

    return (this.cellWidth * myDateFrom.diff(initDate, 'minutes')) / (this.inputOptions.viewScale);
  }

  private _findEventDuration(event: IProject | ITask): number {

    let myDateFrom: Moment = moment(event.date.from);
    const myDateTo: Moment = moment(event.date.to);

    if (moment(this.inputOptions.range.from) > myDateFrom) {
      myDateFrom = moment(this.inputOptions.range.from);
    }

    if (myDateTo.diff(myDateFrom, 'minutes') <= 0) {
      return 0;
    }

    return (this.cellWidth * (myDateTo.diff(myDateFrom, 'minutes'))) / (this.inputOptions.viewScale);
  }

  private _inspectInputOptions(): void {
    this.editScale = this.inputOptions.editScale;
    this.viewScale = this.inputOptions.viewScale;
    this.fromRange = this.inputOptions.range.from;
    this.toRange = this.inputOptions.range.to;
  }

  public viewScaleChanged(value: number): void {
    this.inputOptions.viewScale = value;
    this.viewScale = this.inputOptions.viewScale;
    this._initInspectProjects();
  }

  public editScaleChanged(value: number): void {
    this.inputOptions.editScale = value;
    this.editScale = this.inputOptions.editScale;
    this._initInspectProjects();
  }

  public fromRangeChanged(value: Date): void {
    this.inputOptions.range.from = value;
    this.fromRange = this.inputOptions.range.from;
    this._initInspectProjects();
  }

  public toRangeChanged(value: Date): void {
    this.inputOptions.range.to = value;
    this.toRange = this.inputOptions.range.to;
    this._initInspectProjects();
  }

  public scrollPositionChanged(value: number): void {
    this.scrollPosition = value;
  }

  public itemDraggedOrCollapsedEvtFired(value: boolean): void {
    this.itemDraggedOrCollapsedEvt = value;
  }

  public itemMovedEvt(): void {
    this._initInspectProjects();
  }
}
