export function timeSlotsIntersection(
  currentStart: number,
  currentEnd: number,
  timeStart: number,
  timeEnd: number,
): boolean {

  /**
   *    timeStart in current interval
   *
   *                 timeStart
   *    --------|--------x----------|------
   *         currStart            currEnd
   *
   */
  const x1 = inInterval(timeStart, currentStart, currentEnd);

  /**
   *      timeEnd in current interval
   *
   *                  timeEnd
   *    --------|--------x----------|------
   *         currStart            currEnd
   *
   */
  const x2 = inInterval(timeEnd, currentStart, currentEnd);


  // and now vice versa

  /**
   *      currStart in time interval
   *
   *                  currStart
   *    --------|--------x----------|------
   *         timeStart            timeEnd
   *
   */
  const x3 = inInterval(currentStart, timeStart, timeEnd);

  /**
   *      currEnd in time interval
   *
   *                  currEnd
   *    --------|--------x----------|------
   *         timeStart            timeEnd
   *
   */

  const x4 = inInterval(currentEnd, timeStart, timeEnd);

  /**
   *  intervals are equal
   */
  const x5 = currentStart === timeStart && currentEnd === timeEnd;

  return x1 || x2 || x3 || x4 || x5;
}

export function inInterval(x: number, intervalStart: number, intervalEnd: number): boolean {
  return (x > intervalStart && x < intervalEnd)
}
