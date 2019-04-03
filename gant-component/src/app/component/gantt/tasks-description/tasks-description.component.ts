import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {IProject} from '../gantt.component.interface';
import {Observable, Subscription} from 'rxjs';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {el} from '@angular/platform-browser/testing/src/browser_util';

@Component({
  selector: 'app-tasks-description',
  templateUrl: './tasks-description.component.html',
  styleUrls: ['./tasks-description.component.scss']
})
export class TasksDescriptionComponent implements OnInit, OnDestroy {

  @Input() projectsObservable: Observable<Array<IProject>>;
  private _subscription: Subscription;
  public projects: Array<IProject>;

  constructor() {}

  ngOnInit() {

    this._subscription = this.projectsObservable.subscribe((value: Array<IProject>) => {
      this.projects = value;
    });

  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  public toggleCollapseProject(projectClicked: IProject): void {
    projectClicked.collapsed = !projectClicked.collapsed;
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.projects, event.previousIndex, event.currentIndex);
  }

  dropInside(event: CdkDragDrop<string[]>) {
    console.log(event.container.data);
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  }

  generateBgColorByIndex(index: number): string {
    console.log(index);
    if (0 === index % 2) {
      return '#f0f8ff';
    } else {
      return 'white';
    }
  }
}
