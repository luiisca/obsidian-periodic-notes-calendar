import type { Moment } from 'moment';
import { App, normalizePath, Notice, TFile, TFolder, Vault } from 'obsidian';

import { getDateFromFile, getDateUID } from './parse';
import { getDailyNoteSettings } from './settings';
import { getTemplateInfo, getNotePath } from './vault';
import dayjs, { Dayjs } from 'dayjs';
import type { IPeriodicNoteSettings } from './types';

export class DailyNotesFolderMissingError extends Error {}

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
export async function createDailyNote(date: Dayjs): Promise<TFile> {
	const app = window.app as App;
	const { vault } = app;

	const { template, folder, format } = getDailyNoteSettings();
	console.table(getDailyNoteSettings());

	// TODO: Find out what IFoldInfo is used for (think it is for keeping track of openned folders)
	const [templateContents, IFoldInfo] = await getTemplateInfo(template);
	console.log('getTemplateInfo:', templateContents, IFoldInfo);

	const filename = date.format(format);
	const normalizedPath = await getNotePath(folder, filename);
	console.log('NOrmalized path', normalizedPath);

	try {
		const createdFile = await vault.create(
			normalizedPath,
			templateContents
				.replace(/{{\s*date\s*}}/gi, filename)
				.replace(/{{\s*time\s*}}/gi, date.format('HH:mm'))
				.replace(/{{\s*title\s*}}/gi, filename)
				.replace(
					/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
					(_, _timeOrDate, calc, timeDelta, unit, dayjsFormat) => {
						let currentDate = window.dayjs();

						if (calc) {
							currentDate = currentDate.add(parseInt(timeDelta, 10), unit);
						}

						if (dayjsFormat) {
							return currentDate.format(dayjsFormat.substring(1).trim());
						}
						return currentDate.format(format);
					}
				)
				.replace(/{{\s*yesterday\s*}}/gi, date.subtract(1, 'd').format(format))
				.replace(/{{\s*tomorrow\s*}}/gi, date.add(1, 'd').format(format))
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(app as any).foldManager.save(createdFile, IFoldInfo);

		return createdFile;
	} catch (err) {
		console.error(`Failed to create file: '${normalizedPath}'`, err);
		new Notice('Unable to create new file.');
	}
}

export function getDailyNote(date: Moment, dailyNotes: Record<string, TFile>): TFile {
	return dailyNotes[getDateUID(date, 'day')] ?? null;
}

export function getAllDailyNotes(): Record<string, TFile> {
	const dailyNotes: Record<string, TFile> = {};
	/**
	 * Find all daily notes in the daily note folder
	 */
	const { vault } = window.app;
	try {
		const { folder } = getDailyNoteSettings() as IPeriodicNoteSettings;

		const dailyNotesFolder = vault.getAbstractFileByPath(
			normalizePath(folder as string)
		) as TFolder;

		if (!dailyNotesFolder) {
			throw new DailyNotesFolderMissingError(
				"Unable to locate the daily notes folder. Check your plugin's settings."
			);
		}

		Vault.recurseChildren(dailyNotesFolder, (note) => {
			if (note instanceof TFile) {
				const date = getDateFromFile(note, 'day');
				if (date) {
					const dateString = getDateUID(date, 'day');
					dailyNotes[dateString] = note;
				}
			}
		});

		return dailyNotes;
	} catch (error) {
		typeof error === 'string' && new Notice(error);

		return dailyNotes;
	}
}
