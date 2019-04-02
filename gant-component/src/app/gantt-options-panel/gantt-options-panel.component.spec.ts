import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GanttOptionsPanelComponent } from './gantt-options-panel.component';

describe('GanttOptionsPanelComponent', () => {
  let component: GanttOptionsPanelComponent;
  let fixture: ComponentFixture<GanttOptionsPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GanttOptionsPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GanttOptionsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
