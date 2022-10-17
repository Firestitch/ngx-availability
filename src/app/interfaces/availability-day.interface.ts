import { Day } from '@firestitch/availability';
import { ITimeAvailability } from './availability-time.interface';

export interface IDayAvailability {
  day?: Day;
  selected?: boolean;
  times?: ITimeAvailability[],
}
