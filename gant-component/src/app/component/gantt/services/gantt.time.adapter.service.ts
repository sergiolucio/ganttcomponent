import {Injectable} from '@angular/core';
import {NgbTimeAdapter, NgbTimeStruct} from '@ng-bootstrap/ng-bootstrap';
import {moment} from '../gantt.constants';

@Injectable()
export class GanttTimeStructAdapter extends NgbTimeAdapter<Date> {
  public fromModel(value: Date): NgbTimeStruct {
    if (!value) {
      value = new Date();
    }
    return {
      hour: value.getHours(),
      minute: value.getMinutes(),
      second: value.getSeconds()
    };
  }

  public toModel(time: NgbTimeStruct): Date {
    return moment(`${time.hour}-${time.minute}-${time.second}`, 'HH-mm-ss').toDate();
  }
}
