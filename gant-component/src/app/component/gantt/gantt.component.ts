import {Component, Input, OnInit} from '@angular/core';
import {EScaleStates, IProject} from './gantt.component.interface';
import * as $ from 'jquery';
import {DomSanitizer} from '@angular/platform-browser';
import {debug} from 'util';

@Component({
  selector: 'app-gantt',
  templateUrl: './gantt.component.html',
  styleUrls: ['./gantt.component.scss']
})
export class GanttComponent implements OnInit {
  @Input() scaleState: EScaleStates;
  @Input() projects: Array<IProject>;

  public tasksParentWidth: number;
  public tasksDescWidth: number;
  public tasksWidth: number;
  public tasksDivisionWidth: number;
  public grabber: boolean;
  public oldX: number;

  private _projectClicked: IProject;
  private _numOfChildren: number;

  constructor(
    private _sanitizer: DomSanitizer
  ) {
  }

  ngOnInit() {
    this.tasksParentWidth = $('div.row.tables-container').width();
    this.tasksDescWidth = this.tasksParentWidth * 0.285;
    this.tasksWidth = this.tasksParentWidth * 0.7;
    this.tasksDivisionWidth = this.tasksParentWidth * 0.005;
    this.grabber = false;
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

  public toggleChildrenVisibility(ev: any, projectId: string): void {

    this._findProjectClicked(projectId, this.projects);

    this._numOfChildren = 0;
    this._findChildren(this._projectClicked);

    const $myParentProj = $('#' + projectId);
    $($myParentProj).toggleClass('collapsed');
    
    if ($($myParentProj).hasClass('collapsed')) {
      $($myParentProj)
        .nextAll(':lt(' + this._numOfChildren + ')')
        .addClass('hidden');
    } else {
      $($myParentProj)
        .nextAll(':lt(' + this._numOfChildren + ')')
        .removeClass('hidden')
        .removeClass('collapsed');
    }
  }

  private _findProjectClicked(projId: string, arrayProjects: Array<IProject>): void {

      for (const proj of arrayProjects) {
        if (proj.id === projId) {
          this._projectClicked = proj;
        } else if (proj.projectChildren && proj.projectChildren.length > 0) {
          this._findProjectClicked(projId, proj.projectChildren);
        }
      }
  }

  private _findChildren(project: IProject): void {

    if (project.tasks && project.tasks.length > 0) {
      this._numOfChildren += project.tasks.length;
    }

    if (project.projectChildren && project.projectChildren.length > 0) {
      this._numOfChildren += project.projectChildren.length;

      for (const p of project.projectChildren) {
          this._findChildren(p);
      }

    }
  }
}
