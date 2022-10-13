import { ChangeDetectionStrategy, Input, Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

import { MatSelect } from '@angular/material/select';

import { guid, index } from '@firestitch/common';

import { addMinutes, format, getUnixTime, startOfWeek, addDays, isSameDay, endOfMonth, addSeconds } from 'date-fns';

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
  public nextDayTimes = [];
  public Days = index(Days, 'value', 'name');
  public DayAbrs = index(Days, 'value', 'abr');
  public days = [];
  public weekDays: any = [];
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
    private _form: NgForm,
    private _cdRef: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.initDays();
    this.initTimes();

    if (this.startDate) {
      this.initWeekDays();
    }

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
      if (!dayAvailability.times.length) {
        this.addTime(availability.day);
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


  public initWeekDays(): void {
    const startWeek = addDays(startOfWeek(this.startDate), this.startDay);
    this.weekDays = [
      {
        date: startWeek,
      }
    ];

    for (let i = 1; i < 7; i++) {
      this.weekDays.push({
        date: addDays(startWeek, i),
      });
    }

    this.weekDays
      .forEach((item) => {
        item.isEndOfMonth = isSameDay(
          item.date,
          endOfMonth(item.date),
        );
        item.monthName = format(item.date, 'MMMM');
        item.dayOfWeek = format(item.date, 'EEE');
        item.dayOfMonth = format(item.date, 'dd');
      });
  }

  public generateTime(max, initial = 0): any[] {
    let date = addSeconds(new Date(null), initial);
    const times = [];
    while (getUnixTime(date) < max) {
      const seconds = getUnixTime(date);
      if (seconds) {
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
      ...this.generateTime(this.DaySeconds)
    ];

    this.endTimes = [
      ...this.generateTime(this.DaySeconds),
      {
        seconds: this.DaySeconds,
        label: 'Midnight',
      },
    ];

    this.nextDayTimes = this.generateTime(this.DaySeconds * 2, this.DaySeconds + (15 * 60));
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
    this.change();
  }

  public dayClick(day): void {
    const dayAvailability = this.getDayAvailability(day);
    dayAvailability.selected = !dayAvailability.selected;

    this.change();
  }

  public timeAddClick(day): void {
    this.addTime(day);
    this.change();

    setTimeout(() => {
      this._updateValidity();
    })
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
      }, [])
      .sort((a, b) => {
        if (a.start < b.start && a.day < b.day) {
          return -1;
        }

        if (a.start > b.start && a.day > b.day) {
          return 1;
        }


        return 0;
      });

    this.availabilitiesChange.emit(availabilities);
    this._updateValidity();
  }

  public changeStart(time): void {
    if (time.start > time.end) {
      time.end = null;
    }

    this.change();
  }

  public changeEnd(time): void {
    if (time.start > time.end) {
      time.start = null;
    }

    this.change();
  }

  public openedChangeStart(opened, matSelect: MatSelect, time): void {
    if (opened) {
      if (!matSelect.value) {
        const el = matSelect.panel.nativeElement
        .querySelector(`[ng-reflect-value="${this.defaultStartScrollTo}"]`);

        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    }
  }

  public openedChangeEnd(opened, matSelect: MatSelect, time): void {
    if (opened) {
      if (!matSelect.value) {
        const el = matSelect.panel.nativeElement
        .querySelector(`[ng-reflect-value="${time.start || this.defaultEndScrollTo}"]`);

        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    }
  }

  public validateTime = (formControl, { day, timeIndex }) => {
    const currentDayAvailability = this.dayAvailabilities[day];
    if(!currentDayAvailability.selected) {
      return true;
    }

    let currentTime: any = currentDayAvailability.times[timeIndex];
    const times = this.dayAvailabilities
      .filter((dayAvailability) => dayAvailability.selected)
      .reduce((accum, dayAvailability) => {
        return [
          ...accum,
          ...dayAvailability.times
          .filter((time) => {
            return currentTime !== time;
          })
          .map((time) => {
            return {
              ...time,
              startHour: time.start / 60 / 60,
              endHour: time.end / 60 / 60,
              day: dayAvailability.day,
              start: time.start + (dayAvailability.day * this.DaySeconds),
              end: time.end + (dayAvailability.day * this.DaySeconds),
            };
          }),
        ]
      }, []);

    currentTime = {
      ...currentTime,
      startHour: currentTime.start / 60 / 60,
      endHour: currentTime.end / 60 / 60,
      day,
      start: currentTime.start + (day * this.DaySeconds),
      end: currentTime.end + (day * this.DaySeconds)
    };

    const found = times.find((time) => {
      const currentStart = currentTime.start;
      const currentEnd = currentTime.end;
      const timeStart = time.start;
      const timeEnd = time.end;

      return (currentStart < timeStart && currentEnd < timeEnd) ||  
        (currentStart > timeStart && currentEnd < timeEnd) ||  
        (currentStart > timeStart && currentEnd > timeEnd) || 
        (currentStart < timeStart && currentEnd > timeEnd);
    })

    if (found) {
      throw new Error('Conflicting time slot');
    }

    return true;
  }

  private _updateValidity(): void {
    Object.values(this._form.controls)
      .forEach(control => {
        control.markAsDirty();
        control.markAsTouched();
        control.updateValueAndValidity();
      });
  }
}
