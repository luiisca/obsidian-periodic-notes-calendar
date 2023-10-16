import type { Moment } from 'moment';

export interface IWeek {
	days: Moment[];
	weekNum: number;
}

export type IMonth = IWeek[];

function isMacOS() {
	return navigator.appVersion.indexOf('Mac') !== -1;
}

export function isMetaPressed(e: MouseEvent): boolean {
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
	const locale = window.moment().locale();
	const month = [];
	let week: IWeek = { days: [], weekNum: 0 };

	const startOfMonth = displayedDate.clone().locale(locale).date(1);
	const startOffset = startOfMonth.weekday();
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