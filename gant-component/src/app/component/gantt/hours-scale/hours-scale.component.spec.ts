import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursScaleComponent } from './hours-scale.component';

describe('HoursScaleComponent', () => {
  let component: HoursScaleComponent;
  let fixture: ComponentFixture<HoursScaleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HoursScaleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HoursScaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
