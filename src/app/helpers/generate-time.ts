import { addMinutes, addSeconds, format, getUnixTime } from 'date-fns';

import { IDayTime } from '../interfaces/day-time.interface';


export function generateTime(max, initial = 0): IDayTime[] {
  const times = [];
  let date = addSeconds(new Date(null), initial);

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
