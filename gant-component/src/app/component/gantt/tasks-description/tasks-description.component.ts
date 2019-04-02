import {Component, Input, OnInit} from '@angular/core';
import {IProject} from '../gantt.component.interface';
import {Observable} from 'rxjs';
import * as $ from 'jquery';
import * as moment from 'moment';

@Component({
  selector: 'app-tasks-description',
  templateUrl: './tasks-description.component.html',
  styleUrls: ['./tasks-description.component.scss']
})
export class TasksDescriptionComponent implements OnInit {

  @Input() projectsObservable: Observable<Array<IProject>>;
  public projects: Array<IProject>;

  constructor() {}

  ngOnInit() {

    this.projectsObservable.subscribe((value: Array<IProject>) => {
      this.projects = value;
    });

  }

  public toggleCollapseProject(projectClicked: IProject): void {
    projectClicked.collapsed = !projectClicked.collapsed;
  }
}
