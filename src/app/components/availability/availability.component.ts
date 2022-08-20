import { ChangeDetectionStrategy, Input, Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

import { MatSelect } from '@angular/material/select';

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

  readonly DaySeconds = 60 * 60 * 24;

  @Input() public availabilities: Availability[] = [];
  @Input() public defaultStart: number = null;
  @Input() public defaultEnd: number = null;
  @Input() public defaultStartScrollTo: number = null;
  @Input() public defaultEndScrollTo: number = null;
  @Input() public startDay = Day.Sunday;
  @Input() public startDate: Date = null;

  @Output() public availabilitiesChange = new EventEmitter<{
    guid?: any,
    day?: Day;
    start?: number;
    end?: number;
  }[]>();

  public startTimes = [];
  public endTimes = [];
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

  public constructor(
    private _cdRef: ChangeDetectorRef,
  ) {}

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
      const dayIndex = this.getDayIndex(availability.day);
      const dayAvailability = this.dayAvailabilities[dayIndex];
      this.dayAvailabilities[dayIndex] = {
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

    this.dayAvailabilities.forEach((availability) => {
      const dayIndex = this.getDayIndex(availability.day);
      const dayAvailability = this.dayAvailabilities[dayIndex];
      if(!dayAvailability.times.length) {
        this.addTime(availability.day)    
      }
    });
    
    this._cdRef.detectChanges();
  }
  
  public getDayIndex(day) {
    return this.days.indexOf(day);
  }

  public initDays(): void {
    for (let i = this.startDay; i < 7; i++) {
      this.days.push(i);
    }

    for (let i = 0; i < this.startDay; i++) {
      this.days.push(i);
    }
  }

  public generateTime(): any[] {
    let date = new Date(null);
    const times = [];
    while(getUnixTime(date) < this.DaySeconds) {
      const seconds = getUnixTime(date);
      if(seconds) {
        times.push({
          seconds,
          label: format(addMinutes(date, date.getTimezoneOffset()), 'h:mm aa'), 
        });
      }

      date = addMinutes(date, 15);
    } 

    return times;
  }

  public initTimes(): void {
    this.startTimes = [
      {
        seconds: 0,
        label: 'Anytime',
      },
      ...this.generateTime()
    ];

    this.endTimes = [
      ...this.generateTime(),
      {
        seconds: this.DaySeconds - 1,
        label: 'Anytime',
      },      
    ];
  }
  
  public getDayAvailability(day) {
    return this.dayAvailabilities[this.getDayIndex(day)];
  }
  
  public addTime(day): void {
    this.getDayAvailability(day)
    .times.push({
      guid: guid(),
      start: this.defaultStart,
      end: this.defaultEnd,
    });
  }

  public selectedClick(): void {
    this._cdRef.detectChanges();
    this.change();
  }

  public dayClick(day): void {
    const dayAvailability = this.getDayAvailability(day);
    dayAvailability.selected = !dayAvailability.selected;
    this._cdRef.detectChanges();
    this.change();
  }

  public timeAddClick(day): void {
    this.addTime(day);
    this.change();
  }

  public timeDeleteClick(day, index): void {
    const dayAvailability = this.getDayAvailability(day);
    dayAvailability.times = dayAvailability.times
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

  public changeStart(time): void {
    if(time.start > time.end) {
      time.end = null;
    }

    this.change();
  }

  public changeEnd(time): void {
    if(time.start > time.end) {
      time.start = null;
    }

    this.change();
  }

  public openedChangeStart(opened, matSelect: MatSelect, time): void {
    if(opened) {
      if(!matSelect.value) {
        const el = matSelect.panel.nativeElement
        .querySelector(`[ng-reflect-value="${this.defaultStartScrollTo}"]`);

        if(el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    }
  }

  public openedChangeEnd(opened, matSelect: MatSelect, time): void {
    if(opened) {
      if(!matSelect.value) {
        const el = matSelect.panel.nativeElement
        .querySelector(`[ng-reflect-value="${time.start || this.defaultEndScrollTo}"]`);

        if(el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    }
  }
}
