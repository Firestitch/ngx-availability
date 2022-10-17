import { ChangeDetectionStrategy, Input, Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

import { guid, index } from '@firestitch/common';

import { format, startOfWeek, addDays, isSameDay, endOfMonth } from 'date-fns';

import { Days } from '../../consts';
import { Day } from '../../enums';
import { Availability } from '../../interfaces';
import { IDayAvailability } from '../../interfaces/availability-day.interface';
import { DaySeconds } from '../../consts/day-seconds';
import { generateTime } from '../../helpers/generate-time';
import { EightHours } from '../../consts/eight-hours';
import { FifteenMinutes } from '../../consts/fifteen-minutes';
import { IDayTime } from '../../interfaces/day-time.interface';


@Component({
  selector: 'fs-availability',
  templateUrl: './availability.component.html',
  styleUrls: [ './availability.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
})
export class FsAvailabilityComponent implements OnInit {

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

  public Days = index(Days, 'value', 'name');
  public DayAbrs = index(Days, 'value', 'abr');
  public days = [];
  public weekDays: any = [];
  public dayAvailabilities: IDayAvailability[] = [];
  public readonly dayTimes: IDayTime[] = generateTime(DaySeconds);
  public readonly nextDayTimes: IDayTime[] = generateTime(
    DaySeconds + EightHours + FifteenMinutes,
    DaySeconds + FifteenMinutes,
  );

  public constructor(
    private _form: NgForm,
    private _cdRef: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.initDays();

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
        this.addTime(availability.day, this.defaultStart, this.defaultEnd);
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

  public getDayAvailability(day) {
    return this.dayAvailabilities[this.getDayIndex(day)];
  }

  public addTime(day, defaultStart, defaultEnd): void {
    if (defaultStart === DaySeconds && defaultEnd === DaySeconds) {
      defaultEnd += FifteenMinutes;
    }

    this.getDayAvailability(day)
      .times.push({
        guid: guid(),
        start: defaultStart,
        end: defaultEnd,
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

  public timeAddClick({ dayIndex, day }): void {
    const maxEnd = this.dayAvailabilities[dayIndex].times
      .reduce((max, time) => {
        return time.end > max ? time.end : max;
      }, 0);

    this.addTime(day, maxEnd, this.defaultEnd);
    this.change();

    setTimeout(() => {
      this._updateValidity();
    })
  }

  public timeDeleteClick({ day, timeIndex }): void {
    const dayAvailability = this.getDayAvailability(day);
    dayAvailability.times = dayAvailability.times
    .filter((_, index) => {
      return timeIndex !== index;
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

  public validateTime = (formControl, { day, dayIndex, timeIndex }) => {
    const currentDayAvailability = this.dayAvailabilities[dayIndex];
    if (!currentDayAvailability.selected) {
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
              start: time.start + (dayAvailability.day * DaySeconds),
              end: time.end + (dayAvailability.day * DaySeconds),
            };
          }),
        ]
      }, []);

    currentTime = {
      ...currentTime,
      startHour: currentTime.start / 60 / 60,
      endHour: currentTime.end / 60 / 60,
      day,
      start: currentTime.start + (day * DaySeconds),
      end: currentTime.end + (day * DaySeconds)
    };

    const found = times.find((time) => {
      const currentStart = currentTime.start;
      const currentEnd = currentTime.end;
      const timeStart = time.start;
      const timeEnd = time.end;

      return (currentStart < timeStart && currentEnd > timeStart) ||  // Straddle the start time
        (currentStart > timeStart && currentEnd < timeEnd) ||  // Between start and end time
        (currentStart < timeEnd && currentEnd > timeEnd) ||  // Straddle the end time
        (currentStart < timeStart && currentEnd > timeEnd) || // Outside the start and end time
        (currentStart === timeStart && currentEnd === timeEnd);
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
