import { localeDataStore } from '@/stores';
import type { Moment } from 'moment';
import { get } from 'svelte/store';

export interface IWeek {
    days: Moment[];
    weekNum: number;
}

export type IMonth = IWeek[];

function isMacOS() {
    return navigator.appVersion.indexOf('Mac') !== -1;
}

export function isControlPressed(e: MouseEvent | KeyboardEvent): boolean {
    return isMacOS() ? e.metaKey : e.ctrlKey;
}

export function getDaysOfWeek(): string[] {
    return window.moment.weekdaysShort(true);
}

export function isWeekend(date: Moment): boolean {
    return date.isoWeekday() === 6 || date.isoWeekday() === 7;
}

export function getStartOfWeek(days: Moment[]): Moment {
    return days[0].weekday(0);
}
/**
 * Generate a 2D array of daily information to power
 * the calendar view.
 */
export function getMonth(displayedDate: Moment): IMonth {
    const locale = displayedDate.locale();
    const month = [];
    let week: IWeek = { days: [], weekNum: 0 };

    const startOfMonth = displayedDate.clone().locale(locale).date(1);
    const startOffset = get(localeDataStore).weekdays.indexOf(startOfMonth.format('dddd'));
    let date: Moment = startOfMonth.clone().subtract(startOffset, 'days');

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
        Array(COLUMNS).fill(0)
    ) as IYearsGroup;

    for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
        for (let colIndex = 0; colIndex < COLUMNS; colIndex++) {
            years[rowIndex][colIndex] = crrRangeYear;
            crrRangeYear++;
        }
    }

    return years;
}

/**
    * example: [['Notice first part'], ['second part', 'u-pop'], ...]
    */
export function genNoticeFragment(mssgFragments: ([string] | [string, string])[]) {
    const fragment = document.createDocumentFragment();
    for (const mssg of mssgFragments) {
        const mssgSpan = document.createElement('span');
        mssgSpan.textContent = mssg[0];
        mssgSpan.className = mssg[1] || "";
        fragment.appendChild(mssgSpan);
    }

    return fragment;
}

export * from './picker';
export * from './event-handlers';
export * from './cn'
