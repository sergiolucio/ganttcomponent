import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-gantt-options-panel',
  templateUrl: './gantt-options-panel.component.html',
  styleUrls: ['./gantt-options-panel.component.scss']
})
export class GanttOptionsPanelComponent implements OnInit {

  @Input() hourScaleSelected: number;
  @Output() hourScaleSelectedChange: EventEmitter<number>;

  @Input() minRangeSelected: Date;
  @Output() minRangeSelectedChange: EventEmitter<Date>;
  @Input() maxRangeSelected: Date;
  @Output() maxRangeSelectedChange: EventEmitter<Date>;

  constructor() {
    this.hourScaleSelectedChange = new EventEmitter<number>();
    this.minRangeSelectedChange = new EventEmitter<Date>();
    this.maxRangeSelectedChange = new EventEmitter<Date>();
  }

  ngOnInit() {
  }

  public hourScaleSelectedChanged(value: number): void {
    this.hourScaleSelectedChange.emit(value);
  }

  public minRangeSelectedChanged(date: Date): void {
    this.minRangeSelected = date;
    this.minRangeSelectedChange.emit(date);
  }

  public maxRangeSelectedChanged(date: Date): void {
    this.maxRangeSelected = date;
    this.maxRangeSelectedChange.emit(date);
  }
}
