import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeHoursScaleComponent } from './three-hours-scale.component';

describe('ThreeHoursScaleComponent', () => {
  let component: ThreeHoursScaleComponent;
  let fixture: ComponentFixture<ThreeHoursScaleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThreeHoursScaleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreeHoursScaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
