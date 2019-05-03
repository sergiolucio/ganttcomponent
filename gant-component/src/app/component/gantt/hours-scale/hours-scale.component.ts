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
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as moment from 'moment';
import {IItem, IItems, ILink} from '../gantt.component.interface';
import {Observable, Subscription} from 'rxjs';
import {CdkDragEnd, CdkDragMove, CdkDragStart} from '@angular/cdk/drag-drop';
import {nodeForEach} from '../shared/utilities';
import {Moment} from 'moment';

@Component({
  selector: 'app-hours-scale',
  templateUrl: './hours-scale.component.html',
  styleUrls: ['./hours-scale.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HoursScaleComponent implements OnInit, OnChanges, OnDestroy {

  // variáveis que armazenam e manipulam os items/projectos recebidos
  @Input() itemsObservable: Observable<IItems>;
  private _itemsSubscription: Subscription;
  public items: IItems;
  @Input() itemsKeys: Array<string>;
  @Input() itemsKeysDatasource: Array<string>;
  @Input() itemDraggedOrCollapsedEvt: boolean;

  // inputs com opções
  @Input() linkActive: boolean;
  @Input() linkEditable: boolean;
  @Input() viewScale: number;
  @Input() editScale: number;
  @Input() fromRange: Date;
  @Input() toRange: Date;
  @Output() viewScaleChange: EventEmitter<number>;
  @Output() editScaleChange: EventEmitter<number>;
  @Output() fromRangeChange: EventEmitter<Date>;
  @Output() toRangeChange: EventEmitter<Date>;

  public totalDateRange: Array<Date>;
  public scaleRange: Array<Date>;

  // variáveis de configuração de dimensões do layout
  @Input() elmtCellWidth: number;
  public dateCellWidth: number;
  public backgroundLayerWidth: number;

  // variáveis do virtual scroll
  @Output() verticalVirtualScroll: EventEmitter<Event>;
  @Input() verticalScrollPositionY: number;
  @Output() verticalScrollPositionChange: EventEmitter<number>;
  private _verticalScrollViewPort: HTMLElement;
  private _verticalScrollHistory: number;
  private _isScrollingVertically: number;
  private _indexMax: number;
  private _indexMin: number;
  public freeSpaceTop: number;
  @Input() horizontalScrollContainerWidth: number;
  private _horizontalScrollViewPort: HTMLElement;
  private _horizontalScrollHistory: number; // histórico do scroll para saber se está a aumentar ou diminuir;
  public freeSpaceLeft: number; // espaço a ser gerado à esquerda do conteúdo vizivel em px;

  // variáveis do drag and drop
  private _dragInitPositionX: number;
  public guideLineVisible: boolean;
  public guideLinePositionLeft: number;
  private _guideLineInitPosition: number;
  @Output() itemMovedEvt: EventEmitter<boolean>;
  private _isFirstInc: boolean;
  public guideLineTimeInfo: Date;

  // variáveis do resize das tarefas
  private _resizeTaskStarted: boolean;
  private _taskInitWidth: number;
  private _taskInitX: number;
  private _taskInitMarginLeft: number;

  // variáveis do drag new link
  private _dragLinkStarted: boolean;
  private _originalClientX: number;
  private _originalClientY: number;
  private _originalLeftPosition: number;
  private _originalTopPosition: number;
  private _originalLinkItem: IItem;

  constructor() {
    this.verticalScrollPositionChange = new EventEmitter<number>();
    this.itemMovedEvt = new EventEmitter<boolean>();
    this.viewScaleChange = new EventEmitter<number>();
    this.editScaleChange = new EventEmitter<number>();
    this.fromRangeChange = new EventEmitter<Date>();
    this.toRangeChange = new EventEmitter<Date>();
    this.verticalVirtualScroll = new EventEmitter<Event>();
  }

  ngOnInit() {

    this.itemDraggedOrCollapsedEvt = false;
    this.guideLineVisible = false;
    this._resizeTaskStarted = false;
    this._dragLinkStarted = false;

    this._itemsSubscription = this.itemsObservable.subscribe((value: IItems) => {
      this.items = value;
    });

    // 1 dia = 24h = 1440 min
    // 1 célula  <->  1 viewScale (ex. 60 min)
    // x células <->  1 dia (1440 min)
    // x = 1 dia / 1 viewScale -> depois é preciso convertir x em uma só célula -> x * this.elmtCellWidth
    this.dateCellWidth = (1440 / this.viewScale) * this.elmtCellWidth;

    const myScrollViewport: HTMLElement = document.querySelector('div.background-tasks-container') as HTMLElement;
    const myModelViewportHeight: number = (document.querySelector('#tasks-description') as HTMLElement).clientHeight;
    myScrollViewport.style.height = (myModelViewportHeight - 64) + 'px';

    this._initViewPortSizeEventListener();

    this._initHorizontalVirtualScroll();

    this.backgroundLayerWidth = this.dateCellWidth * this.totalDateRange.length;

    this._setScaleRange();

    this._initVerticalVirtualScroll();

    this.freeSpaceLeft = 0;
    this._horizontalScrollHistory = 0;
    this._indexMin = 0;
    this._indexMax = this.itemsKeysDatasource.length - 1;
    this.freeSpaceTop = 0;
  }

  ngOnChanges(
    {
      viewScale,
      fromRange,
      toRange,
      verticalScrollPositionY,
      horizontalScrollContainerWidth,
      itemDraggedOrCollapsedEvt
    }: SimpleChanges
  ): void {
    if (viewScale && !viewScale.isFirstChange()) {

      this._setScaleRange();
      this.dateCellWidth = (1440 / this.viewScale) * this.elmtCellWidth;
      this.freeSpaceLeft = 0;

      this._initHorizontalVirtualScroll();

      this.backgroundLayerWidth = this.dateCellWidth * this.totalDateRange.length;
    }

    if (fromRange && !fromRange.isFirstChange()) {

      if (moment(fromRange.currentValue).toDate() > this.toRange) {

        console.log('Erro - Input range.to - valor mínimo superior ao máximo no Range de amostragem.');
        this.fromRange = fromRange.previousValue;

      } else {
        this.fromRange = fromRange.currentValue;
        this.freeSpaceLeft = 0;
        this._initHorizontalVirtualScroll();
      }
    }

    if (toRange && !toRange.isFirstChange()) {

      if (moment(toRange.currentValue).toDate() < this.fromRange) {

        console.log('Erro - Input range.from - valor máximo inferior ao mínimo no Range de amostragem.');
        this.toRange = toRange.previousValue;

      } else {
        this.toRange = toRange.currentValue;
        this.freeSpaceLeft = 0;
        this._initHorizontalVirtualScroll();
      }
    }

    if (verticalScrollPositionY && !verticalScrollPositionY.isFirstChange()) {
      document.querySelector('.background-tasks-container').scroll(0, verticalScrollPositionY.currentValue);
    }

    if (horizontalScrollContainerWidth && !horizontalScrollContainerWidth.isFirstChange()) {
      this.freeSpaceLeft = 0;
      this._initHorizontalVirtualScroll();
    }

    if (itemDraggedOrCollapsedEvt && !itemDraggedOrCollapsedEvt.isFirstChange()) {
      this._refreshVerticalVirtualScroll();
    }
  }

  ngOnDestroy(): void {
    this._dettachHorizontalScrollEvent();
    this._dettachVerticalScrollEvent();
  }

  private _initHorizontalVirtualScroll(): void {
    const myScrollContainerWidth: number = this.horizontalScrollContainerWidth;
    let myRenderedWidth = 0;
    const date = moment(this.fromRange);

    this.totalDateRange = [];

    while (myRenderedWidth <= myScrollContainerWidth) {
      this.totalDateRange.push(date.toDate());
      date.add(1, 'days');
      myRenderedWidth += this.dateCellWidth;
    }

    // this.totalDateRange.push(date.toDate());

    document.querySelector('#background-content').scrollLeft = 0;
  }

  private _initVerticalVirtualScroll() {
    const myScrollViewPortHeight: number = document.querySelector('.background-tasks-container').clientHeight;

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

    document.querySelector('.background-tasks-container').scroll(0, 0);
  }

  private _refreshVerticalVirtualScroll(): void {
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

  @ViewChild('horizontalScrollViewPort')
  public set horizontalScrollViewPort(value: ElementRef<HTMLElement>) {
    this._horizontalScrollViewPort = value ? value.nativeElement : undefined;
    this._attachHorizontalScrollEvent();
  }

  public fnHorizontalScrollEventHandler = (event: Event) => this._horizontalScrollEventHandler(event);

  private _attachHorizontalScrollEvent(): void {
    if (this._horizontalScrollViewPort) {
      this._horizontalScrollViewPort.addEventListener<'scroll'>('scroll', this.fnHorizontalScrollEventHandler, {passive: true});
    }
  }

  private _dettachHorizontalScrollEvent(): void {
    if (this._horizontalScrollViewPort) {
      this._horizontalScrollViewPort.removeEventListener<'scroll'>('scroll', this.fnHorizontalScrollEventHandler);
    }
  }


  private _horizontalScrollEventHandler(event: Event): void {

    const myFnEventHandler = () => {

      const myScrollLeft = (event.target as HTMLElement).scrollLeft;
      const myScrollWidth = (event.target as HTMLElement).scrollWidth;
      const myScrollViewPortWidth: number = this._horizontalScrollViewPort.clientWidth;
      const myElmtWidth: number = this.dateCellWidth;

      if (this._horizontalScrollHistory < myScrollLeft) { // condição que verifica que o scroll está a crescer -> direita

        this._horizontalScrollHistory = myScrollLeft;

        // 1º preciso de saber se o elemento que vai desaparecer ainda se encontra visível
        // (scrollLeft > que primeiro elemento + this.freeSpaceLeft)
        // se já não se encontrar visível pode desaparecer

        if (myElmtWidth + this.freeSpaceLeft < myScrollLeft) {
          this.totalDateRange.shift();
          this.freeSpaceLeft += myElmtWidth;
        }

        // 2º preciso de saber se ainda tenho elementos no fundo
        // se já não tiver preciso de renderizar mais -> verificar se há mais a renderizar

        if (
          myScrollWidth - myScrollLeft - myScrollViewPortWidth <= 30 &&
          this.totalDateRange[this.totalDateRange.length - 1] < this.toRange
        ) {
          this.totalDateRange.push(moment(this.totalDateRange[this.totalDateRange.length - 1]).add(1, 'days').toDate());
        }

      } else { // scroll a diminuir -> esquerda

        // 1º preciso de saber se o elemento que vai desaparecer ainda se encontra visível
        // se já não se encontrar visível pode desaparecer

        if (myScrollWidth - myScrollLeft - myScrollViewPortWidth > myElmtWidth) {
          this.totalDateRange.pop();
        }

        // 2º preciso de saber se ainda tenho elementos no topo
        // se já não tiver preciso de renderizar mais -> verificar se há mais a renderizar
        // logo após renderizar o elemento preciso de retirar a altura correspondente ao mesmo ao freeSpaceTop

        if (
          myScrollLeft <= this.freeSpaceLeft + 30 &&
          this.totalDateRange[0] > this.fromRange
        ) {
          this.totalDateRange.unshift(moment(this.totalDateRange[0]).subtract(1, 'days').toDate());
          this.freeSpaceLeft -= myElmtWidth;
        }
      }

      this._horizontalScrollHistory = myScrollLeft;
    };

    myFnEventHandler();

    setTimeout(myFnEventHandler, 300);
  }

  @ViewChild('verticalScrollViewPort')
  public set verticalScrollViewPort(value: ElementRef<HTMLElement>) {
    this._verticalScrollViewPort = value ? value.nativeElement : undefined;
    this._attachVerticalScrollEvent();
  }

  public fnVerticalScrollEventHandler = (event: Event) => this._verticalScrollEventHandler(event);

  private _verticalScrollEventHandler(event: Event) {

    const myFnEventHandler = () => {
      const myScrollTop: number = (event.target as HTMLElement).scrollTop;
      const myScrollHeight: number = (event.target as HTMLElement).scrollHeight;
      const myScrollViewPortHeight: number = this._verticalScrollViewPort.clientHeight;

      this.verticalScrollPositionY = myScrollTop;
      this.verticalScrollPositionChange.emit(myScrollTop);

      // verificar se o scroll esta a subir ou a descer
      if (this._verticalScrollHistory < myScrollTop) {
        this._verticalScrollHistory = myScrollTop;

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
          if (this.freeSpaceTop === 0) {
            this.freeSpaceTop += 8;
          }
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
        this._verticalScrollHistory = myScrollTop;

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
          if (this.freeSpaceTop <= 8) {
            this.freeSpaceTop = 0;
          }
        }
      }
    };

    myFnEventHandler();

    if (this._isScrollingVertically) {
      clearTimeout(this._isScrollingVertically);
    }

    this._isScrollingVertically = setTimeout(myFnEventHandler, 66);
  }

  private _attachVerticalScrollEvent(): void {
    if (this._verticalScrollViewPort) {
      this._verticalScrollViewPort.addEventListener<'scroll'>('scroll', this.fnVerticalScrollEventHandler, {passive: true});
    }
  }

  private _dettachVerticalScrollEvent(): void {
    if (this._verticalScrollViewPort) {
      this._verticalScrollViewPort.removeEventListener<'scroll'>('scroll', this.fnVerticalScrollEventHandler);
    }
  }

  private _setScaleRange(): void {
    this.scaleRange = [];

    for (const i = moment('00:00', 'HH:mm'); i < moment('24:00', 'HH:mm'); i.add(this.viewScale, 'minutes')) {
      this.scaleRange.push(i.toDate());
    }
  }

  public startDrag(event: CdkDragStart): void {
    const myDraggedElmt: HTMLElement = event.source.element.nativeElement;
    this._dragInitPositionX = myDraggedElmt.getBoundingClientRect().left;

    const myParentElmt: HTMLElement = myDraggedElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;

    this.guideLineVisible = true;
    this._guideLineInitPosition = this._dragInitPositionX - myParentElmtPositionX;
    this.guideLinePositionLeft = this._guideLineInitPosition;
    this._isFirstInc = true;
  }

  public dragMoved(event: CdkDragMove, item: IItem): void {

    const myDraggedElmt: HTMLElement = event.source.element.nativeElement;
    const myElmtActualPosition: number = myDraggedElmt.getBoundingClientRect().left;
    const myDeltaX: number = myElmtActualPosition - this._dragInitPositionX;
    const myDragScale: number = (this.elmtCellWidth * this.editScale) / this.viewScale;
    const myDecimalPart: number = (myDeltaX / myDragScale) % 1; // o resto da divisão de um número por 1 dá a parte décimal

    if (event.delta.x > 0) {

      if (myDecimalPart >= 0) {
        if (myDecimalPart >= 0.5 && this._isFirstInc) {
          this.guideLinePositionLeft = this._guideLineInitPosition + (myDragScale * Math.round(myDeltaX / myDragScale));
          this._isFirstInc = false;
        } else if (myDecimalPart <= 0.49) {
          this._isFirstInc = true;
        }
      } else {
        if (myDecimalPart >= -0.49 && this._isFirstInc) {
          this.guideLinePositionLeft = this._guideLineInitPosition + (myDragScale * Math.round(myDeltaX / myDragScale));
          this._isFirstInc = false;
        } else if (myDecimalPart <= -0.5) {
          this._isFirstInc = true;
        }
      }
    } else if (event.delta.x < 0) {
      if (myDecimalPart >= 0) {
        if (myDecimalPart <= 0.49 && this._isFirstInc) {
          this.guideLinePositionLeft = this._guideLineInitPosition + (myDragScale * Math.round(myDeltaX / myDragScale));
          this._isFirstInc = false;
        } else if (myDecimalPart >= 0.5) {
          this._isFirstInc = true;
        }
      } else {
        if (myDecimalPart <= -0.5 && this._isFirstInc) {
          this.guideLinePositionLeft = this._guideLineInitPosition + (myDragScale * Math.round(myDeltaX / myDragScale));
          this._isFirstInc = false;
        } else if (myDecimalPart >= -0.49) {
          this._isFirstInc = true;
        }
      }
    }

    const myParentElmt: HTMLElement = myDraggedElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;
    const myFinalPositionX: number = this.guideLinePositionLeft + myParentElmtPositionX;
    const myFinalDeltaX: number = myFinalPositionX - this._dragInitPositionX;

    // calcular através dos px movidos a diferença em minutos da posição original
    const myDateDiff = (myFinalDeltaX) * (this.viewScale) / this.elmtCellWidth;

    this.guideLineTimeInfo = moment(item.date.from).add(myDateDiff, 'minutes').toDate();
  }

  public itemDragged(event: CdkDragEnd, item: IItem): void {
    const myDraggedElmt: HTMLElement = event.source.element.nativeElement;

    const myParentElmt: HTMLElement = myDraggedElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;

    const myFinalPositionX: number = this.guideLinePositionLeft + myParentElmtPositionX;
    const myDeltaX: number = myFinalPositionX - this._dragInitPositionX;

    // calcular através dos px movidos a diferença em minutos da posição original
    const myDateDiff = (myDeltaX) * (this.viewScale) / this.elmtCellWidth;

    item.date.from = moment(item.date.from).add(myDateDiff, 'minutes').toDate();
    item.date.to = moment(item.date.to).add(myDateDiff, 'minutes').toDate();

    this.guideLineVisible = false;

    // código para fazer 'reset' ao drag... sem isto quando pegassemos duas vezes o mesmo elemento ele ia somar ao drag anterior!
    myDraggedElmt.style.transform = 'none';
    const source: any = event.source;
    source._dragRef._passiveTransform = {x: 0, y: 0};

    this.itemMovedEvt.emit(true);
  }

  public startResizeTaskLeftSide(event: CdkDragStart, item: IItem): void {
    const myElmt: HTMLElement = event.source.element.nativeElement.parentElement;
    this._taskInitWidth = myElmt.clientWidth;
    this._taskInitX = myElmt.getBoundingClientRect().left;
    this._taskInitMarginLeft = Number(item._detailsStyle['margin-left'].replace('px', ''));

    const myParentElmt: HTMLElement = myElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;

    this.guideLineVisible = true;
    this._guideLineInitPosition = myElmt.getBoundingClientRect().left - myParentElmtPositionX;
    this.guideLinePositionLeft = this._guideLineInitPosition;
    this._isFirstInc = true;
  }

  public resizingTaskLeftSide(event: CdkDragMove, item: IItem): void {
    const myElmt: HTMLElement = event.source.element.nativeElement.parentElement;

    const myDeltaX: number = this._taskInitX - event.pointerPosition.x; // positivo qd se desloca rtl;
    const myElmtWidth: number = this._taskInitWidth + myDeltaX;
    const myElmtMarginLeft: number = this._taskInitMarginLeft - myDeltaX;
    const myDragScale: number = (this.elmtCellWidth * this.editScale) / this.viewScale;
    const myDecimalPart: number = (myDeltaX / myDragScale) % 1; // o resto da divisão de um número por 1 dá a parte décimal

    if (myElmtWidth > myDragScale) {
      item._detailsStyle['width'] = myElmtWidth + 'px';
      item._detailsStyle['margin-left'] = myElmtMarginLeft + 'px';

      if (event.delta.x > 0) {

        if (myDecimalPart >= 0) {
          if (myDecimalPart >= 0.5 && this._isFirstInc) {
            this.guideLinePositionLeft = this._guideLineInitPosition - (myDragScale * Math.round(myDeltaX / myDragScale));
            this._isFirstInc = false;
          } else if (myDecimalPart <= 0.49) {
            this._isFirstInc = true;
          }
        } else {
          if (myDecimalPart >= -0.49 && this._isFirstInc) {
            this.guideLinePositionLeft = this._guideLineInitPosition - (myDragScale * Math.round(myDeltaX / myDragScale));
            this._isFirstInc = false;
          } else if (myDecimalPart <= -0.5) {
            this._isFirstInc = true;
          }
        }
      } else if (event.delta.x < 0) {
        if (myDecimalPart >= 0) {
          if (myDecimalPart <= 0.49 && this._isFirstInc) {
            this.guideLinePositionLeft = this._guideLineInitPosition - (myDragScale * Math.round(myDeltaX / myDragScale));
            this._isFirstInc = false;
          } else if (myDecimalPart >= 0.5) {
            this._isFirstInc = true;
          }
        } else {
          if (myDecimalPart <= -0.5 && this._isFirstInc) {
            this.guideLinePositionLeft = this._guideLineInitPosition - (myDragScale * Math.round(myDeltaX / myDragScale));
            this._isFirstInc = false;
          } else if (myDecimalPart >= -0.49) {
            this._isFirstInc = true;
          }
        }
      }
    }

    // código para fazer 'reset' ao drag...
    const mySource: any = event.source;
    mySource.element.nativeElement.style.transform = 'none';
    mySource._dragRef._passiveTransform = {x: 0, y: 0};

    const myParentElmt: HTMLElement = myElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;
    const myFinalPositionX: number = this.guideLinePositionLeft + myParentElmtPositionX;
    const myFinalDeltaX: number = myFinalPositionX - this._taskInitX;

    // calcular através dos px movidos a diferença em minutos da posição original
    const myDateDiff = (myFinalDeltaX) * (this.viewScale) / this.elmtCellWidth;

    this.guideLineTimeInfo = moment(item.date.from).add(myDateDiff, 'minutes').toDate();
  }

  public endResizeTaskLeftSide(event: CdkDragEnd, item: IItem): void {
    const myElmt: HTMLElement = event.source.element.nativeElement.parentElement;

    const myParentElmt: HTMLElement = myElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;

    const myFinalPositionX: number = this.guideLinePositionLeft + myParentElmtPositionX;
    const myDeltaX: number = myFinalPositionX - this._taskInitX;

    // calcular através dos px movidos a diferença em minutos da posição original
    const myDateDiff = (myDeltaX) * (this.viewScale) / this.elmtCellWidth;

    item.date.from = moment(item.date.from).add(myDateDiff, 'minutes').toDate();

    this.guideLineVisible = false;

    // código para fazer 'reset' ao drag... sem isto quando pegassemos duas vezes o mesmo elemento ele ia somar ao drag anterior!
    myElmt.style.transform = 'none';
    const source: any = event.source;
    source._dragRef._passiveTransform = {x: 0, y: 0};

    this.itemMovedEvt.emit(true);
  }

  public startResizeTaskRightSide(event: CdkDragStart, item: IItem): void {
    const myElmt: HTMLElement = event.source.element.nativeElement.parentElement;
    this._taskInitWidth = myElmt.clientWidth;
    this._taskInitX = myElmt.getBoundingClientRect().left + this._taskInitWidth;

    const myParentElmt: HTMLElement = myElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;

    this.guideLineVisible = true;
    this._guideLineInitPosition = (myElmt.getBoundingClientRect().left + this._taskInitWidth) - myParentElmtPositionX;
    this.guideLinePositionLeft = this._guideLineInitPosition;
    this._isFirstInc = true;
  }

  public resizingTaskRightSide(event: CdkDragMove, item: IItem): void {
    const myElmt: HTMLElement = event.source.element.nativeElement.parentElement;

    const myDeltaX: number = event.pointerPosition.x - this._taskInitX; // positivo qd se desloca ltr;
    const myElmtWidth: number = this._taskInitWidth + myDeltaX;
    const myDragScale: number = (this.elmtCellWidth * this.editScale) / this.viewScale;
    const myDecimalPart: number = (myDeltaX / myDragScale) % 1; // o resto da divisão de um número por 1 dá a parte décimal


    if (myElmtWidth > myDragScale) {
      item._detailsStyle['width'] = myElmtWidth + 'px';

      if (event.delta.x > 0) {

        if (myDecimalPart >= 0) {
          if (myDecimalPart >= 0.5 && this._isFirstInc) {
            this.guideLinePositionLeft = this._guideLineInitPosition + (myDragScale * Math.round(myDeltaX / myDragScale));
            this._isFirstInc = false;
          } else if (myDecimalPart <= 0.49) {
            this._isFirstInc = true;
          }
        } else {
          if (myDecimalPart >= -0.49 && this._isFirstInc) {
            this.guideLinePositionLeft = this._guideLineInitPosition + (myDragScale * Math.round(myDeltaX / myDragScale));
            this._isFirstInc = false;
          } else if (myDecimalPart <= -0.5) {
            this._isFirstInc = true;
          }
        }
      } else if (event.delta.x < 0) {
        if (myDecimalPart >= 0) {
          if (myDecimalPart <= 0.49 && this._isFirstInc) {
            this.guideLinePositionLeft = this._guideLineInitPosition + (myDragScale * Math.round(myDeltaX / myDragScale));
            this._isFirstInc = false;
          } else if (myDecimalPart >= 0.5) {
            this._isFirstInc = true;
          }
        } else {
          if (myDecimalPart <= -0.5 && this._isFirstInc) {
            this.guideLinePositionLeft = this._guideLineInitPosition + (myDragScale * Math.round(myDeltaX / myDragScale));
            this._isFirstInc = false;
          } else if (myDecimalPart >= -0.49) {
            this._isFirstInc = true;
          }
        }
      }
    }

    // código para fazer 'reset' ao drag... sem isto quando pegassemos duas vezes o mesmo elemento ele ia somar ao drag anterior!
    const mySource: any = event.source;
    mySource.element.nativeElement.style.transform = 'none';
    mySource._dragRef._passiveTransform = {x: 0, y: 0};

    const myParentElmt: HTMLElement = myElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;
    const myFinalPositionX: number = this.guideLinePositionLeft + myParentElmtPositionX;
    const myFinalDeltaX: number = myFinalPositionX - this._taskInitX;

    // calcular através dos px movidos a diferença em minutos da posição original
    const myDateDiff = (myFinalDeltaX) * (this.viewScale) / this.elmtCellWidth;

    this.guideLineTimeInfo = moment(item.date.to).add(myDateDiff, 'minutes').toDate();
  }

  public endResizeTaskRightSide(event: CdkDragEnd, item: IItem): void {
    const myElmt: HTMLElement = event.source.element.nativeElement.parentElement;

    const myParentElmt: HTMLElement = myElmt.parentElement;
    const myParentElmtPositionX = myParentElmt.getBoundingClientRect().left;

    const myFinalPositionX: number = this.guideLinePositionLeft + myParentElmtPositionX;
    const myDeltaX: number = myFinalPositionX - this._taskInitX;

    // calcular através dos px movidos a diferença em minutos da posição original
    const myDateDiff = (myDeltaX) * (this.viewScale) / this.elmtCellWidth;

    item.date.to = moment(item.date.to).add(myDateDiff, 'minutes').toDate();

    this.guideLineVisible = false;

    // código para fazer 'reset' ao drag... sem isto quando pegassemos duas vezes o mesmo elemento ele ia somar ao drag anterior!
    myElmt.style.transform = 'none';
    const source: any = event.source;
    source._dragRef._passiveTransform = {x: 0, y: 0};

    this.itemMovedEvt.emit(true);
  }

  public startDragLink(event: MouseEvent, item: IItem): void {
    if (this.linkEditable) {
      console.log(event);
      this._dragLinkStarted = true;
      const circles: NodeList = document.querySelectorAll('div.left-circle');
      nodeForEach(circles, value => {
        (value as HTMLElement).classList.add('active');
      });

      const myParentElmt: HTMLElement = event.srcElement.parentElement;

      this._originalLinkItem = item;
      this._originalClientX = event.x;
      this._originalClientY = event.y;

      myParentElmt.insertAdjacentHTML('afterend',
        `<svg class="link temporaryLink"
             width="0"
             height="0">
          <path class="first-back-path" d="M0 0" fill="none" stroke-width="3" stroke="blue"></path>
          <path class="second-back-path" d="M0 0" fill="none" stroke-width="3" stroke="blue"></path>
          <path class="first-path" d="M0 0" fill="none" stroke-width="3" stroke="blue"></path>
          <path class="second-path" d="M0 0" fill="none" stroke-width="3" stroke="blue"></path>
          <path class="third-path" d="M0 0" fill="none" stroke-width="3" stroke="blue" marker-end="url(#head)"></path>
          <defs>
            <marker id='head' orient='auto' markerWidth='2' markerHeight='4' refX='0' refY='2'>
              <!-- triangle pointing right (+x) -->
              <path d='M0,0 V4 L2,2 Z' fill='blue'></path>
            </marker>
          </defs>
        </svg>`);

      this._originalLeftPosition =
        (Number(myParentElmt.style.marginLeft.replace('px', '')) +
          Number(myParentElmt.style.width.replace('px', ''))) + 6;

      this._originalTopPosition = item._orderNumber * 32 - 32 + 8;
      console.log(item._orderNumber);

      const mySvg: HTMLElement = document.querySelector('svg.temporaryLink');
      mySvg.style.left = `${this._originalLeftPosition}px`;
      mySvg.style.top = `${this._originalTopPosition}px`;
    }
  }

  public draggingLink(event: MouseEvent): void {
    if (this._dragLinkStarted) {
      const mySvg: HTMLElement = document.querySelector('svg.temporaryLink');

      let myDeltaX: number;
      let myDeltaY: number;
      let myLeftPosition: number;
      let myTopPosition: number;

      const myFirstBackPath: HTMLElement = document.querySelector('svg.temporaryLink path.first-back-path');
      const mySecondBackPath: HTMLElement = document.querySelector('svg.temporaryLink path.second-back-path');
      const myFirstPath: HTMLElement = document.querySelector('svg.temporaryLink path.first-path');
      const mySecondPath: HTMLElement = document.querySelector('svg.temporaryLink path.second-path');
      const myThirdPath: HTMLElement = document.querySelector('svg.temporaryLink path.third-path');


      if (event.x > this._originalClientX) {
        myFirstBackPath.setAttribute('d', 'M0 0');
        mySecondBackPath.setAttribute('d', 'M0 0');

        myDeltaX = event.x - this._originalClientX;
        mySvg.style.left = `${this._originalLeftPosition}px`;

        if (event.y > this._originalClientY) {
          myDeltaY = event.y - this._originalClientY;
          mySvg.style.top = `${this._originalTopPosition}px`;
          myFirstPath.setAttribute('d', `M0 8 H${myDeltaX - 11}`);
          mySecondPath.setAttribute('d', `M${myDeltaX - 11} 8 V${myDeltaY + 8}`);
          myThirdPath.setAttribute('d', `M${myDeltaX - 11} ${myDeltaY + 8} H${myDeltaX - 6}`);

        } else {
          myDeltaY = this._originalClientY - event.y;
          myTopPosition = this._originalTopPosition - myDeltaY;
          mySvg.style.top = `${myTopPosition}px`;
          myFirstPath.setAttribute('d', `M0 ${myDeltaY + 8} H${myDeltaX - 11}`);
          mySecondPath.setAttribute('d', `M${myDeltaX - 11} 8 V${myDeltaY + 8}`);
          myThirdPath.setAttribute('d', `M${myDeltaX - 11} 8 H${myDeltaX - 6}`);

        }
      } else {


        myDeltaX = (this._originalClientX - event.x) + 30;
        myLeftPosition = this._originalLeftPosition - myDeltaX + 15;
        mySvg.style.left = `${myLeftPosition}px`;

        if (event.y > this._originalClientY) {
          myDeltaY = event.y - this._originalClientY;
          mySvg.style.top = `${this._originalTopPosition}px`;
          myFirstBackPath.setAttribute('d', `M${myDeltaX - 15} 8 H${myDeltaX - 5}`);
          mySecondBackPath.setAttribute('d', `M${myDeltaX - 5} 8 V24`);
          myFirstPath.setAttribute('d', `M3 24 H${myDeltaX - 5}`);
          mySecondPath.setAttribute('d', `M3 24 V${myDeltaY + 8}`);
          myThirdPath.setAttribute('d', `M3 ${myDeltaY + 8} H10`);

        } else {
          myDeltaY = this._originalClientY - event.y;
          myTopPosition = this._originalTopPosition - myDeltaY;
          mySvg.style.top = `${myTopPosition - 8}px`;
          myFirstBackPath.setAttribute('d', `M${myDeltaX - 15} ${myDeltaY + 16} H${myDeltaX - 5}`);
          mySecondBackPath.setAttribute('d', `M${myDeltaX - 5} ${myDeltaY} V${myDeltaY + 16}`);
          myFirstPath.setAttribute('d', `M3 ${myDeltaY} H${myDeltaX - 5}`);
          mySecondPath.setAttribute('d', `M3 ${myDeltaY} V16`);
          myThirdPath.setAttribute('d', `M3 16 H10`);

        }
      }

      mySvg.setAttribute('width', `${myDeltaX}`);
      mySvg.setAttribute('height', `${myDeltaY + 32}`);

      if (myDeltaY < 32) {
        mySvg.setAttribute('height', '64');
      }
    }
  }

  public linkDragged(event: MouseEvent): void {
    if (this._dragLinkStarted) {
      this._dragLinkStarted = false;
      const circles: NodeList = document.querySelectorAll('div.left-circle');
      nodeForEach(circles, value => {
        (value as HTMLElement).classList.remove('active');
      });

      const mySvg: HTMLElement = document.querySelector('svg.temporaryLink');
      mySvg.remove();
    }
  }

  public linkDraggedInTarget(item: IItem): void {
    if (this._dragLinkStarted) {

      if (!this._originalLinkItem.links || this._originalLinkItem.links.length === 0) {
        this._originalLinkItem.links = [];
      }

      const link: ILink = {
        data: item
      };

      this._originalLinkItem.links.push(link);
      this.itemMovedEvt.emit(true);
    }
  }

  public deleteLink(item: IItem): void {
    if (this.linkEditable) {
      if (item._hasPrevious) {
        for (const prev of item.previousLinks) {
          let j = 0;
          for (const link of prev.data.links) {
            if (link.data === item) {
              prev.data.links.splice(j, 1);
            }
            j++;
          }
        }
      }

      item.previousLinks = [];
      this.itemMovedEvt.emit(true);
    }
  }

  private _initViewPortSizeEventListener() {
    window.addEventListener('resize', () => {
      const myScrollViewport: HTMLElement = document.querySelector('div.background-tasks-container') as HTMLElement;
      const myModelViewportHeight: number = (document.querySelector('#tasks-description') as HTMLElement).clientHeight;
      myScrollViewport.style.height = (myModelViewportHeight - 64) + 'px';
      this.dateCellWidth = (1440 / this.viewScale) * this.elmtCellWidth;
      this._initHorizontalVirtualScroll();
      this.backgroundLayerWidth = this.dateCellWidth * this.totalDateRange.length;
      this._refreshVerticalVirtualScroll();
    }, {passive: true});
  }
}
