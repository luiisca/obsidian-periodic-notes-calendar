import type { Moment } from 'moment';
import { Notice, TFile } from 'obsidian';

import { getNotePath, getTemplateInfo } from './vault';
import { getNoteSettingsByGranularity } from './settings';

export class WeeklyNotesFolderMissingError extends Error {}

function getDaysOfWeek(): string[] {
	const { moment } = window;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let weekStart = (<any>moment.localeData())._week.dow;
	const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

	while (weekStart) {
		daysOfWeek.push(daysOfWeek.shift() as string);
		weekStart--;
	}

	return daysOfWeek;
}

export function getDayOfWeekNumericalValue(dayOfWeekName: string): number {
	return getDaysOfWeek().indexOf(dayOfWeekName.toLowerCase());
}

export async function createWeeklyNote(date: Moment): Promise<TFile | undefined> {
	const { vault } = window.app;
	const { template, format, folder } = getNoteSettingsByGranularity('week');
	const [templateContents, IFoldInfo] = await getTemplateInfo(template);
	const filename = date.format(format);
	const normalizedPath = await getNotePath(folder, filename);

	try {
		const createdFile = await vault.create(
			normalizedPath,
			templateContents
				.replace(
					/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
					(_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
						const now = window.moment();
						const currentDate = date.clone().set({
							hour: now.get('hour'),
							minute: now.get('minute'),
							second: now.get('second')
						});
						if (calc) {
							currentDate.add(parseInt(timeDelta, 10), unit);
						}

						if (momentFormat) {
							return currentDate.format(momentFormat.substring(1).trim());
						}
						return currentDate.format(format);
					}
				)
				.replace(/{{\s*title\s*}}/gi, filename)
				.replace(/{{\s*time\s*}}/gi, window.moment().format('HH:mm'))
				.replace(
					/{{\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*:(.*?)}}/gi,
					(_, dayOfWeek, momentFormat) => {
						const day = getDayOfWeekNumericalValue(dayOfWeek);
						return date.weekday(day).format(momentFormat.trim());
					}
				)
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window.app as any).foldManager.save(createdFile, IFoldInfo);

		return createdFile;
	} catch (err) {
		console.error(`Failed to create file: '${normalizedPath}'`, err);
		new Notice(`Failed to create file: '${normalizedPath}'`);
	}
}
