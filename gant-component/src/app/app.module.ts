import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CDK_DRAG_CONFIG, DragDropModule} from '@angular/cdk/drag-drop';
import {UiScrollModule} from 'ngx-ui-scroll';
import {MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule} from '@angular/material';
import {NgbModule, NgbTimeAdapter} from '@ng-bootstrap/ng-bootstrap';

import {AppComponent} from './app.component';
import {GanttComponent} from './component/gantt/gantt.component';
import {HoursScaleStateComponent} from './states/hours-scale-state/hours-scale-state.component';
import {RouterModule} from '@angular/router';
import {HoursScaleComponent} from './component/gantt/hours-scale/hours-scale.component';
import {TasksDescriptionComponent} from './component/gantt/tasks-description/tasks-description.component';
import {GanttOptionsPanelComponent} from './component/gantt/gantt-options-panel/gantt-options-panel.component';
import {GanttTimeStructAdapter} from './component/gantt/services/gantt.time.adapter.service';

const appRoutes = [
  {path: '', component: HoursScaleStateComponent},
  {path: '**', redirectTo: '', pathMatch: 'full'}
];

@NgModule({
  declarations: [
    AppComponent,
    GanttComponent,
    HoursScaleComponent,
    HoursScaleStateComponent,
    TasksDescriptionComponent,
    GanttOptionsPanelComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    FormsModule,
    BrowserAnimationsModule,
    DragDropModule,
    UiScrollModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    NgbModule
  ],
  providers: [
    {
      provide: CDK_DRAG_CONFIG,
      useValue: {
        dragStartThreshold: 5,
        pointerDirectionChangeThreshold: 1
      }
    },
    {
      provide: NgbTimeAdapter,
      useClass: GanttTimeStructAdapter
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
