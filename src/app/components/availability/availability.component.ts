import { ChangeDetectionStrategy, Input, Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

import { MatSelect } from '@angular/material/select';

import { guid, index } from '@firestitch/common';

import { addMinutes, format, getUnixTime, startOfWeek, addDays, isSameDay, endOfMonth } from 'date-fns';

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

  public generateTime(): any[] {
    let date = new Date(null);
    const times = [];
    while (getUnixTime(date) < this.DaySeconds) {
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
    this._updateValidity();
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
          };
        }),
      ];
    }, []);

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
    const times = this.dayAvailabilities[day].times;
    const currentTimeFrame = times[timeIndex];

    if (!currentTimeFrame.start || !currentTimeFrame.end) { return }

    const hasOverlaps = times.some((timeFrame, timeFrameIndex) => {
      if (timeFrameIndex === timeIndex || !timeFrame.start || !timeFrame.end) { return false }

      return currentTimeFrame.end >= timeFrame.start && timeFrame.end >= currentTimeFrame.start;
    })

    if (hasOverlaps) {
      throw new Error('Conflict with another time slot');
    }

    return false;
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
