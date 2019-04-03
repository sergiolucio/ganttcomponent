import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule} from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppComponent } from './app.component';
import { GanttComponent } from './component/gantt/gantt.component';
import { HoursScaleStateComponent } from './states/hours-scale-state/hours-scale-state.component';
import {RouterModule} from '@angular/router';
import { HoursScaleComponent } from './component/gantt/hours-scale/hours-scale.component';
import { TasksDescriptionComponent } from './component/gantt/tasks-description/tasks-description.component';
import { GanttOptionsPanelComponent } from './gantt-options-panel/gantt-options-panel.component';

const appRoutes = [
  { path: '', component: HoursScaleStateComponent},
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
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
