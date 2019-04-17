import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IInputOptions} from '../gantt.component.interface';
import {Observable, Subscription} from 'rxjs';

@Component({
  selector: 'app-gantt-options-panel',
  templateUrl: './gantt-options-panel.component.html',
  styleUrls: ['./gantt-options-panel.component.scss']
})
export class GanttOptionsPanelComponent implements OnInit {

  @Input() viewScale: number;
  @Input() editScale: number;
  @Input() fromRange: Date;
  @Input() toRange: Date;

  @Output() viewScaleChange: EventEmitter<number>;
  @Output() editScaleChange: EventEmitter<number>;
  @Output() fromRangeChange: EventEmitter<Date>;
  @Output() toRangeChange: EventEmitter<Date>;

  public editScaleOptions: Array<number>;

  constructor() {
    this.viewScaleChange = new EventEmitter<number>();
    this.editScaleChange = new EventEmitter<number>();
    this.fromRangeChange = new EventEmitter<Date>();
    this.toRangeChange = new EventEmitter<Date>();
  }

  ngOnInit() {
    this._initEditScaleOptions();
  }

  public viewScaleSelectedChanged(value: number): void {
    this.viewScale = value;
    this._initEditScaleOptions();
    this.editScaleChange.emit(this.editScaleOptions[0]);
    this.viewScaleChange.emit(value);
  }

  public editScaleSelectedChanged(value: number): void {
    this.editScale = value;
    this.editScaleChange.emit(value);
  }

  public fromRangeSelectedChanged(date: Date): void {
    this.fromRange = date;
    this.fromRangeChange.emit(date);
  }

  public toRangeSelectedChanged(date: Date): void {
    this.toRange = date;
    this.toRangeChange.emit(date);
  }

  private _initEditScaleOptions(): void {
    this.editScaleOptions = [];

    switch (this.viewScale) {
      case 15:
        this.editScaleOptions.push(5);
        this.editScaleOptions.push(10);
        this.editScaleOptions.push(15);
        this.editScaleOptions.push(30);
        this.editScaleOptions.push(60);
        break;
      case 30:
        this.editScaleOptions.push(5);
        this.editScaleOptions.push(10);
        this.editScaleOptions.push(15);
        this.editScaleOptions.push(30);
        this.editScaleOptions.push(60);
        break;
      case 60:
        this.editScaleOptions.push(15);
        this.editScaleOptions.push(30);
        this.editScaleOptions.push(60);
        break;
      case 180:
        this.editScaleOptions.push(30);
        this.editScaleOptions.push(60);
        this.editScaleOptions.push(180);
        break;
      case 360:
        this.editScaleOptions.push(60);
        this.editScaleOptions.push(180);
        this.editScaleOptions.push(360);
        break;
      case 1440:
        this.editScaleOptions.push(60);
        this.editScaleOptions.push(180);
        this.editScaleOptions.push(360);
        this.editScaleOptions.push(1440);
        break;
    }
  }
}
