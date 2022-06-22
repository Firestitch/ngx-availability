import { ChangeDetectionStrategy, Input, Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

import { guid, index } from '@firestitch/common';

import { addMinutes, format, getUnixTime } from 'date-fns';

import { Days } from '../../consts';
import { Day } from '../../enums';
import { Availability } from '../../interfaces';


@Component({
  selector: 'fs-availability',
  templateUrl: './availability.component.html',
  styleUrls: [ './availability.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
})
export class FsAvailabilityComponent implements OnInit {

  @Input() public availabilities: Availability[] = [];
  
  @Output() public availabilitiesChange = new EventEmitter<{ 
    guid?: any,
    day?: Day; 
    start?: number;
    end?: number;
  }[]>();

  public startDay = Day.Sunday;
  public times = [];
  public Days = index(Days, 'value', 'name');
  public days = [];
  public dayAvailabilities: { 
    day?: Day; 
    selected?: boolean;
    times?: {
      guid?: any,
      start?: number;
      end?: number;
    }[],
  }[] = [];

  public ngOnInit(): void {
    this.initDays();
    this.initTimes();

    this.dayAvailabilities = this.days
    .map((day) => {
      return { 
        day, 
        selected: false,
        times: [],
      };
    });

    this.availabilities.forEach((availability) => {
      const dayAvailability = this.dayAvailabilities[availability.day];
      this.dayAvailabilities[availability.day] = {
        ...dayAvailability,
        selected: true,
        times: [
          ...dayAvailability.times,
          {
            guid: availability.guid,
            start: availability.start,
            end: availability.end,
          }
        ],
      }
    });

    this.dayAvailabilities = this.dayAvailabilities
    .map((dayAvailability) => {
      return { 
        ...dayAvailability,
        times: dayAvailability.times.length ? dayAvailability.times : [
          {
            guid: guid(),
          }
        ],
      };
    });
  }

  public initDays(): void {
    for (let i = this.startDay; i < 7; i++) {
      this.days.push(i);
    }

    for (let i = 0; i < this.startDay; i++) {
      this.days.push(i);
    }
  }

  public initTimes(): void {
    let date = new Date(null);
    while(getUnixTime(date) <= (60 * 60 * 24)) {
      const minutes = getUnixTime(date) / 60;
      this.times.push({
        minutes,
        label: format(addMinutes(date, date.getTimezoneOffset()), 'h:mm aa'), 
      });

      date = addMinutes(date, 15);
    } 
  }

  public dayClick(day): void {
    this.dayAvailabilities[day].selected = !this.dayAvailabilities[day].selected;
    this.change();
  }

  public timeAdd(day): void {
    this.dayAvailabilities[day].times.push({
      guid: guid(),
    });
    
    this.change();
  }

  public timeDelete(day, index): void {
    this.dayAvailabilities[day].times = this.dayAvailabilities[day].times
    .filter((_, _index) => {
      return index !== _index;
    });

    this.change();
  }

  public change(): void {
    const availabilities = this.dayAvailabilities
    .filter((dayAvailabiliy) => dayAvailabiliy.selected)
    .reduce((availabilities, dayAvailabiliy) => {
      return [
        ...availabilities,
        ...dayAvailabiliy.times
        .map((time) => {
          return {
            guid: time.guid,
            day: dayAvailabiliy.day,
            start: time.start,
            end: time.end,
          };
        }),
      ];
    }, []);

    this.availabilitiesChange.emit(availabilities);
  }
}
