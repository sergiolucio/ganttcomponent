import {Component, Input, OnInit} from '@angular/core';
import {EScaleStates, IProject} from './gantt.component.interface';
import * as $ from 'jquery';
import {DomSanitizer} from '@angular/platform-browser';

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

  public generateArray(nElements: number): Array<number> {
    let myArrayNumbers: Array<number>;
    myArrayNumbers = [];

    for (let i = nElements; i > 0; i--) {
      myArrayNumbers.push(i);
    }

    return myArrayNumbers;
  }

  public generateProjectData(project: IProject): string {

    let myGenerateHTML: string;
    myGenerateHTML = '';

    myGenerateHTML +=
      `<tr>
          <td class="task-name" [ngStyle]="{'border-color': ${project.color} }"><div class="tasks-cell">${project.name}</div></td>
          <td class="task-from-date"><div class="tasks-cell">${project.date.from}</div></td>
          <td class="task-to-date"><div class="tasks-cell">${project.date.to}</div></td>
        </tr>`;

    if (project.projectChildren && project.projectChildren.length > 0) {

      for (const proj of project.projectChildren) {
        iteratesOverProject(proj);
      }

    }

    function iteratesOverProject(Obj: IProject): void {
      myGenerateHTML +=
        `<tr>
          <td class="task-name"><div class="tasks-cell">${Obj.name}</div></td>
          <td class="task-from-date"><div class="tasks-cell">${Obj.date.from}</div></td>
          <td class="task-to-date"><div class="tasks-cell">${Obj.date.to}</div></td>
        </tr>`;

      if (Obj.projectChildren && Obj.projectChildren.length > 0) {
        for (const p of Obj.projectChildren) {
          iteratesOverProject(p);
        }
      }
    }

    return myGenerateHTML;
  }
}
