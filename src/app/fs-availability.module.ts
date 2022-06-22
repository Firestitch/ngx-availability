import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

import { FsDatePickerModule } from '@firestitch/datepicker';

import { FsAvailabilityComponent } from './components/availability/availability.component';
import { MatSelectModule } from '@angular/material/select';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,

    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    

    FsDatePickerModule,
  ],
  exports: [
    FsAvailabilityComponent,
  ],
  declarations: [
    FsAvailabilityComponent,
  ],
  providers: [],
})
export class FsAvailabilityModule {
 
}
