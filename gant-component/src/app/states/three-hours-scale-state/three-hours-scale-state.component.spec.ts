import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeHoursScaleStateComponent } from './three-hours-scale-state.component';

describe('ThreeHoursScaleStateComponent', () => {
  let component: ThreeHoursScaleStateComponent;
  let fixture: ComponentFixture<ThreeHoursScaleStateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThreeHoursScaleStateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreeHoursScaleStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
