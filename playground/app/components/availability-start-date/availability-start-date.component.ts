import { Component, inject } from '@angular/core';
import { Availability } from '@firestitch/availability';
import { FsMessage } from '@firestitch/message';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { FsFormModule } from '@firestitch/form';
import { FsAvailabilityComponent } from '../../../../src/app/components/availability/availability.component';
import { MatButton } from '@angular/material/button';
import { JsonPipe } from '@angular/common';


@Component({
    selector: 'app-availability-start-date',
    templateUrl: './availability-start-date.component.html',
    styleUrls: ['./availability-start-date.component.scss'],
    standalone: true,
    imports: [FormsModule, FsFormModule, FsAvailabilityComponent, MatButton, JsonPipe]
})
export class AvailabilityStartDateComponent {
  private _message = inject(FsMessage);


  public availabilities: Availability[] = [
    {
      guid: 1,
      day: 1,
      start: 9 * 60 * 60,
      end: 12 * 60 * 60,
    },
    {
      guid: 1,
      day: 1,
      start: 13 * 60 * 60,
      end: 17 * 60 * 60,
    },    
    {
      guid: 2,
      day: 2,
      start: 9 * 60 * 60,
      end: 17 * 60 * 60,
    },
    {
      guid: 3,
      day: 3,
      start: 9 * 60 * 60,
      end: 17 * 60 * 60,
    },
    {
      guid: 4,
      day: 4,
      start: 9 * 60 * 60,
      end: 17 * 60 * 60,
    },
    {
      guid: 5,
      day: 5,
      start: 9 * 60 * 60,
      end: 17 * 60 * 60,
    }        
  ];

  public date = new Date(2022, 8, 26);

  public submit = () => {
    this._message.success('Saved changes');

    return of(true);
  }

  public availabilitiesChange(availabilities) {
    console.log(availabilities);
    this.availabilities = availabilities;
  }
}
