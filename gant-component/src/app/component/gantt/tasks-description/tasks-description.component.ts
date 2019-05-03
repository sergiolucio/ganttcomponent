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
import {IItem, IItems} from '../gantt.component.interface';
import {from, Observable, Subscription} from 'rxjs';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import * as moment from 'moment';
import {Moment} from 'moment';

@Component({
  selector: 'app-tasks-description',
  templateUrl: './tasks-description.component.html',
  styleUrls: ['./tasks-description.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksDescriptionComponent implements OnInit, OnChanges, OnDestroy {

  @Input() projectsObservable: Observable<IItems>;
  private _subscription: Subscription;
  public items: IItems;
  @Input() itemsKeys: Array<string>;
  @Output() itemsKeysChange: EventEmitter<Array<string>>;
  public itemsKeysDatasource: Array<string>;
  @Output() itemDraggedOrCollapsedEvt: EventEmitter<boolean>;
  private _itemDraggedOrCollapsedEvt: boolean;

  @Input() scrollPosition: number;
  @Output() scrollPositionChange: EventEmitter<number>;

  private _scrollViewPort: HTMLElement;
  private _scrollHistory: number;
  public freeSpaceTop: number;
  private _indexMax: number; // histórico do index dos items adicionados quando o scroll aumenta
  private _indexMin: number; // histórico do index dos items adicionados quando o scroll diminui
  private _isScrolling: number;

  // Output que informa que é preciso atualizar a lista de projectos - ex. qd alteram as suas horas e data
  @Output() updateItems: EventEmitter<boolean>;

  @Input() datePickerActive: boolean;
  @Input() timePickerActive: boolean;

  constructor() {
    this.scrollPositionChange = new EventEmitter<number>();
    this.itemDraggedOrCollapsedEvt = new EventEmitter<boolean>();
    this.updateItems = new EventEmitter<boolean>();
    this.itemsKeysChange = new EventEmitter<Array<string>>();
  }

  ngOnInit() {

    this._subscription = this.projectsObservable.subscribe((value: IItems) => {
      this.items = value;
    });

    this._itemDraggedOrCollapsedEvt = false;

    const myScrollViewport: HTMLElement = document.querySelector('div.scroll-viewport') as HTMLElement;
    const myModelViewportHeight: number = (document.querySelector('#tasks-description') as HTMLElement).clientHeight;
    myScrollViewport.style.height = (myModelViewportHeight - 64) + 'px';

    this._initViewPortSizeEventListener();

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

  public toggleCollapseProject(projectClicked: IItem): void {
    projectClicked.collapsed = !projectClicked.collapsed;
    this._refreshVirtualScroll();
    this._itemDraggedOrCollapsedEvt = !this._itemDraggedOrCollapsedEvt;
    this.itemDraggedOrCollapsedEvt.emit(this._itemDraggedOrCollapsedEvt);
  }

  public dropInside(event: CdkDragDrop<string[]>, item = this.itemsKeys) {
    const myPreviousIndex: number = event.container.data.findIndex((element) => {
      if (event.item.data === element) {
        return true;
      }
    });
    const myCurrentIndex: number = myPreviousIndex + (event.currentIndex - event.previousIndex);

    moveItemInArray(event.container.data, myPreviousIndex, myCurrentIndex);

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
        if (this.items[this.itemsKeysDatasource[0]].collapsed) {
          myFirstElmtHeight = 32; // 32px é a altura de cada row
        } else {
          myFirstElmtHeight = this.items[this.itemsKeysDatasource[0]]._itemsNumber * 32;
        }

        if (myFirstElmtHeight + this.freeSpaceTop < myScrollTop) {
          this.itemsKeysDatasource.shift();
          this._indexMin++;
          this.freeSpaceTop += myFirstElmtHeight;
        }

        // 2º preciso de saber se ainda tenho elementos no fundo
        // se já não tiver preciso de renderizar mais
        // -> verificar se há mais a renderizar (this._indexMax < último elemento de this.items)
        // scrollHeight - scrollTop - scrollViewPortHeight > 0 -> ou mais alguns pixeis de segurança

        if (myScrollHeight - myScrollTop - myScrollViewPortHeight <= 30 && this._indexMax < this.itemsKeys.length - 1) {
          this._indexMax++;
          this.itemsKeysDatasource.push(this.itemsKeys[this._indexMax]);
        }

      } else {
        this._scrollHistory = myScrollTop;

        // 1º preciso de saber se o elemento que vai desaparecer ainda se encontra visível
        // (scrollHeight - scrollTop - scrollViewPortHeight > altura do último elemento)
        // se já não se encontrar visível pode desaparecer

        let myLastElmtHeight: number;

        if (this.items[this.itemsKeysDatasource[this.itemsKeysDatasource.length - 1]].collapsed) {
          myLastElmtHeight = 32;
        } else {
          myLastElmtHeight = this.items[this.itemsKeysDatasource[this.itemsKeysDatasource.length - 1]]._itemsNumber * 32;
        }

        if (myScrollHeight - myScrollTop - myScrollViewPortHeight > myLastElmtHeight) {
          this.itemsKeysDatasource.pop();
          this._indexMax--;
        }

        // 2º preciso de saber se ainda tenho elementos no topo
        // se já não tiver preciso de renderizar mais -> verificar se há mais a renderizar (this._indexMin > 0
        // scrollTop = this.freeSpaceTop -> ou mais alguns pixeis de segurança
        // logo após renderizar o elemento preciso de retirar a altura correspondente ao mesmo ao freeSpaceTop

        if (myScrollTop <= this.freeSpaceTop + 30 && this._indexMin > 0) {

          this._indexMin--;
          this.itemsKeysDatasource.unshift(this.itemsKeys[this._indexMin]);
          let myElmtAdded: number;

          if (this.items[this.itemsKeysDatasource[0]].collapsed) {
            myElmtAdded = 32;
          } else {
            myElmtAdded = this.items[this.itemsKeysDatasource[0]]._itemsNumber * 32;
          }

          this.freeSpaceTop -= myElmtAdded;
        }
      }
    };

    myFnEventHandler();

    if (this._isScrolling) {
      clearTimeout(this._isScrolling);
    }

    this._isScrolling = setTimeout(myFnEventHandler, 66);
  }

  private _initVirtualScroll() {
    const myScrollViewPortHeight: number = document.querySelector('.scroll-viewport').clientHeight;

    let myRenderedHeight = 0;

    this.itemsKeysDatasource = [];

    let i: number;
    for (i = 0; myRenderedHeight <= myScrollViewPortHeight; i++) {
      this.itemsKeysDatasource.push(this.itemsKeys[i]);

      if (this.items[this.itemsKeys[i]].collapsed) {
        myRenderedHeight += 32;
      } else {
        myRenderedHeight += this.items[this.itemsKeys[i]]._itemsNumber * 32;
        // _itemsNumber tem o nº total de items por project; 32 é o nº de px por row
      }
    }

    this._indexMin = 0;
    this._indexMax = this.itemsKeysDatasource.length - 1;
    this.freeSpaceTop = 0;

    document.querySelector('.scroll-viewport').scroll(0, 0);
  }

  private _refreshVirtualScroll(): void {
    this.itemsKeysDatasource = [];
    let myRenderedHeight = 0;
    const myScrollViewPortHeight: number = document.querySelector('.scroll-viewport').clientHeight;
    const myScrollTop: number = document.querySelector('.scroll-viewport').scrollTop;

    let i: number;
    i = this._indexMin;

    do {
      this.itemsKeysDatasource.push(this.itemsKeys[i]);

      if (this.items[this.itemsKeys[i]].collapsed) {
        myRenderedHeight += 32;
      } else {
        myRenderedHeight += this.items[this.itemsKeys[i]]._itemsNumber * 32;
        // _itemsNumber tem o nº total de items por project; 32 é o nº de px por row
      }

      i++;
    } while (myRenderedHeight <= myScrollViewPortHeight + myScrollTop);

    this._indexMax = (this.itemsKeysDatasource.length - 1) + this._indexMin;
  }

  public fromDateChanged(event: any, item: IItem): void {
    let myDate: Moment = moment(event.value);
    myDate = myDate.hours(moment(item.date.from).hours()).minutes(moment(item.date.from).minutes());

    if (myDate < moment(item.date.to)) {
      item.date.from = myDate.toDate();
    }

    this.updateItems.emit();
  }

  public toDateChanged(event: any, item: IItem): void {
    let myDate: Moment = moment(event.value);
    myDate = myDate.hours(moment(item.date.to).hours()).minutes(moment(item.date.to).minutes());

    if (myDate > moment(item.date.from)) {
      item.date.to = myDate.toDate();
    }

    this.updateItems.emit();
  }

  public fromTimeChanged(event: any, item: IItem): void {
    const myDate: Moment = moment(event);

    if (
      moment(item.date.from).hours(myDate.hours()).minutes(myDate.minutes()).toDate() < item.date.to
    ) {
      item.date.from = moment(item.date.from).hours(myDate.hours()).minutes(myDate.minutes()).toDate();
    }

    this.updateItems.emit();
  }

  public toTimeChanged(event: any, item: IItem): void {
    const myDate: Moment = moment(event);

    if (
      moment(item.date.to).hours(myDate.hours()).minutes(myDate.minutes()).toDate() > item.date.from
    ) {
      item.date.to = moment(item.date.to).hours(myDate.hours()).minutes(myDate.minutes()).toDate();
    }

    this.updateItems.emit();
  }

  private _initViewPortSizeEventListener(): void {
    window.addEventListener('resize', () => {
      const myScrollViewport: HTMLElement = document.querySelector('div.scroll-viewport') as HTMLElement;
      const myModelViewportHeight: number = (document.querySelector('#tasks-description') as HTMLElement).clientHeight;
      myScrollViewport.style.height = (myModelViewportHeight - 64) + 'px';
      this._initVirtualScroll();
    }, {passive: true});
  }
}
