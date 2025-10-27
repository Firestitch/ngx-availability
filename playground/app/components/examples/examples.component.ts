import { Component } from '@angular/core';
import { environment } from '@env';
import { FsExampleModule } from '@firestitch/example';
import { AvailabilityComponent } from '../availability/availability.component';
import { AvailabilityStartDateComponent } from '../availability-start-date/availability-start-date.component';


@Component({
    templateUrl: 'examples.component.html',
    standalone: true,
    imports: [FsExampleModule, AvailabilityComponent, AvailabilityStartDateComponent]
})
export class ExamplesComponent {
  public config = environment;
}
