import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {IProject, IProjects, ITask} from '../gantt.component.interface';
import {Observable, Subscription} from 'rxjs';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import * as moment from 'moment';
import {Moment} from 'moment';

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
  private _projectsKeys: Array<string>;
  public projectsKeysDatasource: Array<string>;
  @Output() itemDraggedOrCollapsedEvt: EventEmitter<boolean>;
  private _itemDraggedOrCollapsedEvt: boolean;

  @Input() scrollPosition: number;
  @Output() scrollPositionChange: EventEmitter<number>;

  private _scrollViewPort: HTMLElement;
  private _scrollHistory: number;
  public freeSpaceTop: number;
  private _indexMax: number; // histórico do index dos items adicionados quando o scroll aumenta
  private _indexMin: number; // histórico do index dos items adicionados quando o scroll diminui

  @Output() updateProjects: EventEmitter<boolean>;

  @Input() datePickerActive: boolean;
  @Input() timePickerActive: boolean;

  constructor() {
    this.scrollPositionChange = new EventEmitter<number>();
    this.itemDraggedOrCollapsedEvt = new EventEmitter<boolean>();
    this.updateProjects = new EventEmitter<boolean>();
  }

  ngOnInit() {

    this._subscription = this.projectsObservable.subscribe((value: IProjects) => {
      this.projects = value;
    });

    this._initProjectsKeys();

    this._itemDraggedOrCollapsedEvt = false;

    this._scrollHistory = 0;
    this._initVirtualScroll();
  }

  ngOnChanges({scrollPosition, projectsObservable}: SimpleChanges): void {
    if (scrollPosition && !scrollPosition.isFirstChange()) {
      this.scrollPosition = scrollPosition.currentValue;
      document.querySelector('.scroll-viewport').scroll(0, scrollPosition.currentValue);
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._dettachScrollEvent();
  }

  private _initProjectsKeys(): void {
    this._projectsKeys = [];

    for (const projKey of Object.keys(this.projects)) {
      this._projectsKeys.push(projKey);
    }
  }

  public toggleCollapseProject(projectClicked: IProject): void {
    projectClicked.collapsed = !projectClicked.collapsed;
    this._refreshVirtualScroll();
    this._itemDraggedOrCollapsedEvt = !this._itemDraggedOrCollapsedEvt;
    this.itemDraggedOrCollapsedEvt.emit(this._itemDraggedOrCollapsedEvt);
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

    for (const item of arrayAux) {
      event.container.data[item.name] = item;
    }

    this._initProjectsKeys();

    this._itemDraggedOrCollapsedEvt = !this._itemDraggedOrCollapsedEvt;
    this.itemDraggedOrCollapsedEvt.emit(this._itemDraggedOrCollapsedEvt);

    this._refreshVirtualScroll();
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

    const myFnEventHandler = () => {
      const myScrollTop: number = (event.target as HTMLElement).scrollTop;
      const myScrollHeight: number = (event.target as HTMLElement).scrollHeight;
      const myScrollViewPortHeight: number = this._scrollViewPort.clientHeight;

      this.scrollPositionChange.emit(myScrollTop);

      // verificar se o scroll esta a subir ou a descer
      if (this._scrollHistory < myScrollTop) {
        this._scrollHistory = myScrollTop;

        // 1º preciso de saber se o elemento que vai desaparecer ainda se encontra visível
        // (scrollTop > que primeiro elemento + this.freeSpaceTop)
        // se já não se encontrar visível pode desaparecer

        let myFirstElmtHeight: number;
        // verificar se o projeto está collapsed
        if (this.projects[this.projectsKeysDatasource[0]].collapsed) {
          myFirstElmtHeight = 32; // 32px é a altura de cada row
        } else {
          myFirstElmtHeight = this.projects[this.projectsKeysDatasource[0]]._projectItems * 32;
        }

        if (myFirstElmtHeight + this.freeSpaceTop < myScrollTop) {
          this.projectsKeysDatasource.shift();
          this._indexMin++;
          this.freeSpaceTop += myFirstElmtHeight;
        }

        // 2º preciso de saber se ainda tenho elementos no fundo
        // se já não tiver preciso de renderizar mais
        // -> verificar se há mais a renderizar (this._indexMax < último elemento de this.projects)
        // scrollHeight - scrollTop - scrollViewPortHeight > 0 -> ou mais alguns pixeis de segurança

        if (myScrollHeight - myScrollTop - myScrollViewPortHeight <= 30 && this._indexMax < this._projectsKeys.length - 1) {
          this._indexMax++;
          this.projectsKeysDatasource.push(this._projectsKeys[this._indexMax]);
        }

      } else {
        this._scrollHistory = myScrollTop;

        // 1º preciso de saber se o elemento que vai desaparecer ainda se encontra visível
        // (scrollHeight - scrollTop - scrollViewPortHeight > altura do último elemento)
        // se já não se encontrar visível pode desaparecer

        let myLastElmtHeight: number;

        if (this.projects[this.projectsKeysDatasource[this.projectsKeysDatasource.length - 1]].collapsed) {
          myLastElmtHeight = 32;
        } else {
          myLastElmtHeight = this.projects[this.projectsKeysDatasource[this.projectsKeysDatasource.length - 1]]._projectItems * 32;
        }

        if (myScrollHeight - myScrollTop - myScrollViewPortHeight > myLastElmtHeight) {
          this.projectsKeysDatasource.pop();
          this._indexMax--;
        }

        // 2º preciso de saber se ainda tenho elementos no topo
        // se já não tiver preciso de renderizar mais -> verificar se há mais a renderizar (this._indexMin > 0
        // scrollTop = this.freeSpaceTop -> ou mais alguns pixeis de segurança
        // logo após renderizar o elemento preciso de retirar a altura correspondente ao mesmo ao freeSpaceTop

        if (myScrollTop <= this.freeSpaceTop + 30 && this._indexMin > 0) {

          this._indexMin--;
          this.projectsKeysDatasource.unshift(this._projectsKeys[this._indexMin]);
          let myElmtAdded: number;

          if (this.projects[this.projectsKeysDatasource[0]].collapsed) {
            myElmtAdded = 32;
          } else {
            myElmtAdded = this.projects[this.projectsKeysDatasource[0]]._projectItems * 32;
          }

          this.freeSpaceTop -= myElmtAdded;
        }
      }
    };

    myFnEventHandler();

    setTimeout(myFnEventHandler, 300);
  }

  private _initVirtualScroll() {
    const myScrollViewPortHeight: number = document.querySelector('.scroll-viewport').clientHeight;

    let myRenderedHeight = 0;

    this.projectsKeysDatasource = [];

    let i: number;
    for (i = 0; myRenderedHeight <= myScrollViewPortHeight; i++) {
      this.projectsKeysDatasource.push(this._projectsKeys[i]);

      if (this.projects[this._projectsKeys[i]].collapsed) {
        myRenderedHeight += 32;
      } else {
        myRenderedHeight += this.projects[this._projectsKeys[i]]._projectItems * 32;
        // _projectItems tem o nº total de items por project; 32 é o nº de px por row
      }
    }

    this._indexMin = 0;
    this._indexMax = this.projectsKeysDatasource.length - 1;
    this.freeSpaceTop = 0;

    document.querySelector('.scroll-viewport').scroll(0, 0);
  }

  private _refreshVirtualScroll(): void {
    this.projectsKeysDatasource = [];
    let myRenderedHeight = 0;
    const myScrollViewPortHeight: number = document.querySelector('.scroll-viewport').clientHeight;
    const myScrollTop: number = document.querySelector('.scroll-viewport').scrollTop;

    let i: number;
    i = this._indexMin;

    do {
      this.projectsKeysDatasource.push(this._projectsKeys[i]);

      if (this.projects[this._projectsKeys[i]].collapsed) {
        myRenderedHeight += 32;
      } else {
        myRenderedHeight += this.projects[this._projectsKeys[i]]._projectItems * 32;
        // _projectItems tem o nº total de items por project; 32 é o nº de px por row
      }

      i++;
    } while (myRenderedHeight <= myScrollViewPortHeight + myScrollTop);

    this._indexMax = (this.projectsKeysDatasource.length - 1) + this._indexMin;
  }

  public fromDateChanged(event: any, item: IProject | ITask): void {
    let myDate: Moment = moment(event.value);
    myDate = myDate.hours(moment(item.date.from).hours()).minutes(moment(item.date.from).minutes());
    item.date.from = myDate.toDate();

    this.updateProjects.emit();
  }

  public toDateChanged(event: any, item: IProject | ITask): void {
    let myDate: Moment = moment(event.value);
    myDate = myDate.hours(moment(item.date.to).hours()).minutes(moment(item.date.to).minutes());
    item.date.to = myDate.toDate();

    this.updateProjects.emit();
  }

  public fromTimeChanged(event: any, item: IProject | ITask): void {
    const myDate: Moment = moment(event);
    item.date.from = moment(item.date.from).hours(myDate.hours()).minutes(myDate.minutes()).toDate();

    this.updateProjects.emit();
  }

  public toTimeChanged(event: any, item: IProject | ITask): void {
    const myDate: Moment = moment(event);
    item.date.to = moment(item.date.to).hours(myDate.hours()).minutes(myDate.minutes()).toDate();

    this.updateProjects.emit();
  }
}
