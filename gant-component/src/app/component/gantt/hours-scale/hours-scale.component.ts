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
import {IProject, IProjects, ITask} from '../gantt.component.interface';
import {Observable, Subscription} from 'rxjs';
import {CdkDragEnd, CdkDragMove, CdkDragStart} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-hours-scale',
  templateUrl: './hours-scale.component.html',
  styleUrls: ['./hours-scale.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HoursScaleComponent implements OnInit, OnChanges, OnDestroy {

  // variáveis que armazenam e manipulam os items/projectos recebidos
  @Input() projectsObservable: Observable<IProjects>;
  private _projectsSubscription: Subscription;
  public projects: IProjects;
  @Input() projectsKeys: Array<string>;
  public projectsKeysDatasource: Array<string>;
  @Input() itemDraggedOrCollapsedEvt: boolean;

  // inputs com opções
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
  @Input() verticalScrollPositionY: number;
  @Output() verticalScrollPositionChange: EventEmitter<number>;
  private _verticalScrollViewPort: HTMLElement;
  private _verticalScrollHistory: number;
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
  private _projectCellElmt: HTMLElement;

  constructor() {
    this.verticalScrollPositionChange = new EventEmitter<number>();
    this.itemMovedEvt = new EventEmitter<boolean>();
    this.viewScaleChange = new EventEmitter<number>();
    this.editScaleChange = new EventEmitter<number>();
    this.fromRangeChange = new EventEmitter<Date>();
    this.toRangeChange = new EventEmitter<Date>();
  }

  ngOnInit() {

    this.itemDraggedOrCollapsedEvt = false;
    this.guideLineVisible = false;

    this._projectsSubscription = this.projectsObservable.subscribe((value: IProjects) => {
      this.projects = value;
    });

    // 1 dia = 24h = 1440 min
    // 1 célula  <->  1 viewScale (ex. 60 min)
    // x células <->  1 dia (1440 min)
    // x = 1 dia / 1 viewScale -> depois é preciso convertir x em uma só célula -> x * this.elmtCellWidth
    this.dateCellWidth = (1440 / this.viewScale) * this.elmtCellWidth;

    this._initHorizontalVirtualScroll();

    this.backgroundLayerWidth = this.dateCellWidth * this.totalDateRange.length;

    this._setScaleRange();

    this.freeSpaceLeft = 0;
    this._horizontalScrollHistory = 0;

    this._initVerticalVirtualScroll();
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

    this.projectsKeysDatasource = [];

    let i: number;
    for (i = 0; myRenderedHeight <= myScrollViewPortHeight; i++) {
      this.projectsKeysDatasource.push(this.projectsKeys[i]);

      if (this.projects[this.projectsKeys[i]].collapsed) {
        myRenderedHeight += 32;
      } else {
        myRenderedHeight += this.projects[this.projectsKeys[i]]._projectItems * 32;
        // _projectItems tem o nº total de items por project; 32 é o nº de px por row
      }
    }

    this._indexMin = 0;
    this._indexMax = this.projectsKeysDatasource.length - 1;
    this.freeSpaceTop = 0;

    document.querySelector('.background-tasks-container').scroll(0, 0);
  }

  private _refreshVerticalVirtualScroll(): void {
    this.projectsKeysDatasource = [];
    let myRenderedHeight = 0;
    const myScrollViewPortHeight: number = document.querySelector('.scroll-viewport').clientHeight;
    const myScrollTop: number = document.querySelector('.scroll-viewport').scrollTop;

    let i: number;
    i = this._indexMin;

    do {
      this.projectsKeysDatasource.push(this.projectsKeys[i]);

      if (this.projects[this.projectsKeys[i]].collapsed) {
        myRenderedHeight += 32;
      } else {
        myRenderedHeight += this.projects[this.projectsKeys[i]]._projectItems * 32;
        // _projectItems tem o nº total de items por project; 32 é o nº de px por row
      }

      i++;
    } while (myRenderedHeight <= myScrollViewPortHeight + myScrollTop);

    this._indexMax = (this.projectsKeysDatasource.length - 1) + this._indexMin;
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
        if (this.projects[this.projectsKeysDatasource[0]].collapsed) {
          myFirstElmtHeight = 32; // 32px é a altura de cada row
        } else {
          myFirstElmtHeight = this.projects[this.projectsKeysDatasource[0]]._projectItems * 32;
        }

        if (myFirstElmtHeight + this.freeSpaceTop < myScrollTop) {
          this.projectsKeysDatasource.shift();
          this._indexMin++;
          if (this.freeSpaceTop === 0) {
            this.freeSpaceTop += 8;
          }
          this.freeSpaceTop += myFirstElmtHeight;
        }

        // 2º preciso de saber se ainda tenho elementos no fundo
        // se já não tiver preciso de renderizar mais
        // -> verificar se há mais a renderizar (this._indexMax < último elemento de this.projects)
        // scrollHeight - scrollTop - scrollViewPortHeight > 0 -> ou mais alguns pixeis de segurança

        if (myScrollHeight - myScrollTop - myScrollViewPortHeight <= 30 && this._indexMax < this.projectsKeys.length - 1) {
          this._indexMax++;
          this.projectsKeysDatasource.push(this.projectsKeys[this._indexMax]);
        }

      } else {
        this._verticalScrollHistory = myScrollTop;

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
          this.projectsKeysDatasource.unshift(this.projectsKeys[this._indexMin]);
          let myElmtAdded: number;

          if (this.projects[this.projectsKeysDatasource[0]].collapsed) {
            myElmtAdded = 32;
          } else {
            myElmtAdded = this.projects[this.projectsKeysDatasource[0]]._projectItems * 32;
          }

          this.freeSpaceTop -= myElmtAdded;
          if (this.freeSpaceTop <= 8) {
            this.freeSpaceTop = 0;
          }
        }
      }
    };

    myFnEventHandler();

    setTimeout(myFnEventHandler, 300);
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

  public dragMoved(event: CdkDragMove, item: IProject | ITask): void {

    const myDraggedElmt: HTMLElement = event.source.element.nativeElement;
    const myElmtActualPosition: number = myDraggedElmt.getBoundingClientRect().left;
    const myDeltaX: number = myElmtActualPosition - this._dragInitPositionX;
    const myDragScale: number = (this.elmtCellWidth * this.editScale) / this.viewScale;
    const myDecimalPart: number = (myDeltaX / myDragScale) % 1; // o resto da divisão de um número por 1 dá a parte décimal

    console.log(myDraggedElmt);
    if (event.delta.x > 0) {

      if (myDecimalPart >= 0) {
        if (myDecimalPart >= 0.5 && this._isFirstInc) {
          this.guideLinePositionLeft += myDragScale;
          this._isFirstInc = false;
        } else if (myDecimalPart <= 0.49) {
          this._isFirstInc = true;
        }
      } else {
        if (myDecimalPart >= -0.49 && this._isFirstInc) {
          this.guideLinePositionLeft += myDragScale;
          this._isFirstInc = false;
        } else if (myDecimalPart <= -0.5) {
          this._isFirstInc = true;
        }
      }
    } else if (event.delta.x < 0) {
      if (myDecimalPart >= 0) {
        if (myDecimalPart <= 0.49 && this._isFirstInc) {
          this.guideLinePositionLeft -= myDragScale;
          this._isFirstInc = false;
        } else if (myDecimalPart >= 0.5) {
          this._isFirstInc = true;
        }
      } else {
        if (myDecimalPart <= -0.5 && this._isFirstInc) {
          this.guideLinePositionLeft -= myDragScale;
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

  public itemDragged(event: CdkDragEnd, item: IProject | ITask): void {
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
}
