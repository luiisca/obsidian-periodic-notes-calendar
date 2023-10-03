import type { Dayjs } from 'dayjs';

export interface IWeek {
	days: Dayjs[];
	weekNum: number;
}

export type IMonth = IWeek[];

function isMacOS() {
	return navigator.appVersion.indexOf('Mac') !== -1;
}

export function isMetaPressed(e: MouseEvent): boolean {
	return isMacOS() ? e.metaKey : e.ctrlKey;
}

export function getDaysOfWeek(..._args: unknown[]): string[] {
	return window.moment.weekdaysShort(true);
}

export function isWeekend(date: Dayjs): boolean {
	return date.isoWeekday() === 6 || date.isoWeekday() === 7;
}

/**
 * Generate a 2D array of daily information to power
 * the calendar view.
 */
export function getMonth(displayedMonth: Dayjs): IMonth {
	const month = [];
	let week: IWeek = { days: [], weekNum: 0 };

	const startOfMonth = displayedMonth.date(1);
	const startOffset = startOfMonth.day();
	let date = startOfMonth.subtract(startOffset, 'days');

	for (let _day = 0; _day < 42; _day++) {
		if (_day % 7 === 0) {
			week = {
				days: [],
				weekNum: date.week()
			};
			month.push(week);
		}

		week.days.push(date);
		date = date.add(1, 'days');
	}

	return month;
}
