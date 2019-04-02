import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursScaleStateComponent } from './hours-scale-state.component';

describe('HoursScaleStateComponent', () => {
  let component: HoursScaleStateComponent;
  let fixture: ComponentFixture<HoursScaleStateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HoursScaleStateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HoursScaleStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
