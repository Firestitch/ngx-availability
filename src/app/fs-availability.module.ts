import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FsDatePickerModule } from '@firestitch/datepicker';
import { FsFormModule } from '@firestitch/form';

import { FsAvailabilityComponent } from './components/availability/availability.component';
import { FsMonthDividerComponent } from './components/month-divider/month-divider.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,

    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,

    FsFormModule,
    FsDatePickerModule,
  ],
  exports: [
    FsAvailabilityComponent,
  ],
  declarations: [
    FsAvailabilityComponent,
    FsMonthDividerComponent,
  ],
  providers: [],
})
export class FsAvailabilityModule {
 
}
