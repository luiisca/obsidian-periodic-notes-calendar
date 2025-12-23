import { HUMAN_FORMATS_PER_GRANULARITY } from '@/constants';
import { IGranularity } from '@/io';
import { localeDataStore, todayStore } from '@/stores';
import { Platform } from 'obsidian';
import { get } from 'svelte/store';

export interface IWeek {
  days: moment.Moment[];
  weekNum: number;
}

export type IMonth = IWeek[];

export function isControlPressed(e: MouseEvent | KeyboardEvent): boolean {
  return Platform.isMacOS ? e.metaKey : e.ctrlKey;
}

export function getDaysOfWeek(): string[] {
  return window.moment.weekdaysShort(true);
}

export function isWeekend(date: moment.Moment): boolean {
  return date.isoWeekday() === 6 || date.isoWeekday() === 7;
}

export function getStartOfWeek(days: moment.Moment[]): moment.Moment {
  return days[0].weekday(0);
}
/**
 * Generate a 2D array of daily information to power
 * the calendar view.
 */
export function getMonth(displayedDate: moment.Moment): IMonth {
  const locale = displayedDate.locale();
  const month = [];
  let week: IWeek = { days: [], weekNum: 0 };

  const startOfMonth = displayedDate.clone().locale(locale).date(1);
  const startOffset = get(localeDataStore).weekdays.indexOf(startOfMonth.format('dddd'));
  let date: moment.Moment = startOfMonth.clone().subtract(startOffset, 'days');

  for (let _day = 0; _day < 42; _day++) {
    if (_day % 7 === 0) {
      week = {
        days: [],
        weekNum: date.week()
      };
      month.push(week);
    }

    week.days.push(date);
    date = date.clone().add(1, 'days');
  }

  return month;
}

type IYears = [number, number, number];
type IYearsGroup = [IYears, IYears, IYears, IYears];
export function getYears({ startRangeYear }: { startRangeYear: number }): IYearsGroup {
  let crrRangeYear = startRangeYear;
  const COLUMNS = 3;
  const ROWS = 4;
  const years: IYearsGroup = Array.from({ length: ROWS }, () =>
    Array(COLUMNS).fill(0) as 0[]
  ) as IYearsGroup;

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
    for (let colIndex = 0; colIndex < COLUMNS; colIndex++) {
      years[rowIndex][colIndex] = crrRangeYear;
      crrRangeYear++;
    }
  }

  return years;
}

export function getRelativeDate(granularity: IGranularity, date: moment.Moment) {
  const startOfDate = date.clone().startOf(granularity);
  const startOfToday = get(todayStore).clone().startOf(granularity);
  const diff = startOfDate.diff(startOfToday, granularity);
  const absDiff = Math.abs(diff);
  const humanizedDiff = window.moment.duration(diff, granularity).humanize(true, { d: 7, w: 4 });

  if (absDiff <= 1) {
    if (granularity === 'day') {
      return startOfDate.calendar().split(' ')[0];
    }
  }
  if (absDiff === 0) {
    if (granularity === "week" || granularity === 'month' || granularity === 'quarter' || granularity === 'year') {
      return startOfDate.format(HUMAN_FORMATS_PER_GRANULARITY[granularity]);
    }
  }

  return humanizedDiff
}

/**
    * example: [['Notice first part'], ['second part', 'u-pop'], ...]
    */
export function genNoticeFragment(mssgFragments: ([string] | [string, string] | null)[]) {
  const fragment = document.createDocumentFragment();
  for (const mssg of mssgFragments) {
    if (mssg) {
      const mssgSpan = document.createElement('span');
      mssgSpan.textContent = mssg[0];
      mssgSpan.className = mssg[1] || "";
      fragment.appendChild(mssgSpan);
    }
  }

  return fragment;
}

export * from './cn';
export * from './event-handlers';
export * from './picker';

