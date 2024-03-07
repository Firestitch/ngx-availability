import { ChangeDetectionStrategy, Input, Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

import { MatSelect } from '@angular/material/select';

import { IDayAvailability } from '../../interfaces/availability-day.interface';
import { ITimeAvailability } from '../../interfaces/availability-time.interface';
import { DaySeconds } from '../../consts/day-seconds';
import { generateTime } from '../../helpers/generate-time';
import { IDayTime } from '../../interfaces/day-time.interface';


@Component({
  selector: 'fs-availability-slot',
  templateUrl: './availability-slot.component.html',
  styleUrls: [ './availability-slot.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
})
export class FsAvailabilitySlotComponent implements OnInit {

  @Input()
  public dayTimes: IDayTime[];

  @Input()
  public nextDayTimes: IDayTime[];

  @Input()
  public dayAvailability: IDayAvailability;

  @Input()
  public timeAvailability: ITimeAvailability;

  @Input()
  public day: number;

  @Input()
  public disabled: boolean;

  @Input()
  public dayIndex: number;

  @Input()
  public timeIndex: number;

  @Input()
  public validateTimeFn: any;

  @Input()
  public defaultStartScrollTo: number;

  @Input()
  public defaultEndScrollTo: number;

  @Output()
  public change = new EventEmitter<void>();

  @Output()
  public timeAdd = new EventEmitter<{ dayIndex: number, day: number }>();

  @Output()
  public timeDelete = new EventEmitter<{ day: number; timeIndex: number; }>();

  public readonly daySeconds = DaySeconds;
  public startTimes = [];
  public endTimes = [];

  public ngOnInit() {
    this.initStartTimes();
    this.initEndTimes();
  }

  public initStartTimes() {
    this.startTimes = [
      {
        seconds: 0,
        label: 'Anytime',
      },
      ...this.dayTimes,
    ];

    if (this.timeIndex > 0) {
      this.startTimes.push({
        seconds: DaySeconds,
        label: 'Midnight',
      });
    }
  }

  public initEndTimes() {
    this.endTimes = [
      ...this.dayTimes,
      {
        seconds: DaySeconds,
        label: 'Midnight',
      },
    ].filter((time) => this.timeAvailability.start < time.seconds);

    const eightHours = 60 * 60 * 8;
    const fifteenMinutes = (15 * 60);

    this.nextDayTimes = generateTime(
      DaySeconds + eightHours + fifteenMinutes,
      DaySeconds + (15 * 60)
    );
  }


  public changeStart(time): void {
    if (time.start > time.end) {
      time.end = null;
    }

    this.initEndTimes();
    this._change();
  }

  public changeEnd(time): void {
    if (time.start > time.end) {
      time.start = null;
    }

    this._change();
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

  public timeAddClick(): void {
    this.timeAdd.emit({ dayIndex: this.dayIndex, day: this.day });
  }

  public timeDeleteClick(): void {
    this.timeDelete.emit({ day: this.day, timeIndex: this.timeIndex });
  }

  private _change(): void {
    this.change.emit();
  }
}
