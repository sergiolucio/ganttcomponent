import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { GanttComponent } from './component/gantt/gantt.component';
import { ThreeHoursScaleStateComponent } from './states/three-hours-scale-state/three-hours-scale-state.component';
import {RouterModule} from '@angular/router';
import { ThreeHoursScaleComponent } from './component/gantt/three-hours-scale/three-hours-scale.component';
import {SafePipe} from './pipes/safe.pipe';

const appRoutes = [
  { path: '', component: ThreeHoursScaleStateComponent},
  {path: '**', redirectTo: '', pathMatch: 'full'}
];

@NgModule({
  declarations: [
    AppComponent,
    GanttComponent,
    ThreeHoursScaleStateComponent,
    ThreeHoursScaleComponent,
    SafePipe
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
