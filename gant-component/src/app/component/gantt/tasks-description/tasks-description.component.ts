import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output, SimpleChanges,
  ViewChild
} from '@angular/core';
import {IProject, IProjects} from '../gantt.component.interface';
import {Observable, Subscription} from 'rxjs';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Datasource, IDatasource} from 'ngx-ui-scroll';

@Component({
  selector: 'app-tasks-description',
  templateUrl: './tasks-description.component.html',
  styleUrls: ['./tasks-description.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksDescriptionComponent implements OnInit, OnChanges, OnDestroy {

  @Input() projectsObservable: Observable<IProjects>;
  private _subscription: Subscription;
  public projects: IProjects;
  public projectsKeys: Array<string>;

  public datasource: IDatasource;

  @Input() scrollPosition: number;
  @Output() scrollPositionChange: EventEmitter<number>;

  private _scrollViewPort: HTMLElement;

  constructor() {
    this.scrollPositionChange = new EventEmitter<number>();
  }

  ngOnInit() {

    this._subscription = this.projectsObservable.subscribe((value: IProjects) => {
      this.projects = value;
    });

    this.projectsKeys = [];
    for (const projKey of Object.keys(this.projects)) {
      this.projectsKeys.push(projKey);
    }

    this.datasource = new Datasource({

      get: (index, count, success) => {
        const min = 0;
        const max = this.projectsKeys.length - 1;
        const data = [];
        const start = Math.max(min, index);
        const end = Math.min(index + count - 1, max);
        if (start <= end) {
          for (let i = start; i <= end; i++) {
            data.push(this.projectsKeys[i]);
          }
        }
        success(data);
      },
      settings: {
        bufferSize: 1,
        startIndex: 0
      }

    });
  }

  ngOnChanges({ scrollPosition }: SimpleChanges): void {
    if (scrollPosition && scrollPosition.currentValue > 0 && !scrollPosition.isFirstChange()) {
      const myScrollViewport = document.querySelectorAll('.scroll-viewport');

      // @ts-ignore
      for (const item of myScrollViewport) {
        item.scrollTop = this.scrollPosition;
      }
    }
  }



  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._dettachScrollEvent();
  }

  public toggleCollapseProject(projectClicked: IProject): void {
    projectClicked.collapsed = !projectClicked.collapsed;
    this.datasource.adapter.check();
  }

  public drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.projectsKeys, event.previousIndex, event.currentIndex);
    this.datasource.adapter.reload(this.datasource.adapter.firstVisible.$index);
  }

  public dropInside(event: CdkDragDrop<string[]>) {
    let arrayAux: Array<any>;
    arrayAux = [];

    for (const itemKey of Object.keys(event.container.data)) {
      arrayAux.push(event.container.data[itemKey]);
      delete event.container.data[itemKey];
    }

    const objAux: any = arrayAux[event.previousIndex];

    arrayAux.splice(event.previousIndex, 1);
    arrayAux.splice(event.currentIndex, 0, objAux);

    Object.assign(event.container.data, arrayAux);
  }

  @ViewChild('scrollViewPort')
  public set scrollViewPort(value: ElementRef<HTMLElement>) {
    this._scrollViewPort = value ? value.nativeElement : undefined;
    this._attachScrollEvent();
  }

  public fnScrollEventHandler = (event: Event) => this._scrollEventHandler(event);

  private _attachScrollEvent(): void {
    if (this._scrollViewPort) {
      this._scrollViewPort.addEventListener<'scroll'>('scroll', this.fnScrollEventHandler, {passive: true});
    }
  }

  private _dettachScrollEvent(): void {
    if (this._scrollViewPort) {
      this._scrollViewPort.removeEventListener<'scroll'>('scroll', this.fnScrollEventHandler);
    }
  }

  private _scrollEventHandler(event: Event): void {
    this.scrollPositionChange.emit((event.target as HTMLElement).scrollTop);
  }
}
