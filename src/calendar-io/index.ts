import type moment from 'moment';
import type { Moment } from 'moment';
import { normalizePath, type App, TFile, TFolder, Vault, Notice } from 'obsidian';

declare global {
	interface Window {
		app: App;
		moment: typeof moment;
	}
}

export function appHasNotesPluginLoadedByGranularity(granularity: IGranularity): boolean {
	const { app } = window;
	const periodicity = getPeriodicityFromGranularity(granularity);

	if (periodicity === 'daily') {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const dailyNotesPlugin = (<any>app).internalPlugins.plugins['daily-notes'];
		if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
			return true;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const periodicNotes = (<any>app).plugins.getPlugin('periodic-notes');
	return periodicNotes && periodicNotes.settings?.[periodicity]?.enabled;
}

export function getNoteByGranularity({
	date,
	granularity
}: {
	date: Moment;
	granularity: IGranularity;
}): TFile | undefined {
	const notesStore = get(notesStores[granularity]);

	return notesStore[getDateUID(date, granularity)];
}

export function getAllNotesByGranularity(granularity: IGranularity): Record<string, TFile> {
	const notes: Record<string, TFile> = {};
	const { vault } = window.app;

	try {
		const { folder } = getNoteSettingsByGranularity(granularity);

		const notesFolder = vault.getAbstractFileByPath(normalizePath(folder)) as TFolder;

		if (!notesFolder) {
			throw new Error(
				`Unable to locate the ${getPeriodicityFromGranularity(
					granularity
				)} notes folder. Check your plugin's settings or restart calendar plugin.`
			);
		}

		Vault.recurseChildren(notesFolder, (note) => {
			// console.log(`getAllNotesByGranularity() > Vault.recurseChildren(${notesFolder}) > note: `, note)

			if (note instanceof TFile) {
				// if file name maps to a valid dayjs date, it is saved in store.
				const date = getDateFromFile(note, granularity);
				if (date) {
					const dateUID = getDateUID(date, granularity);
					notes[dateUID] = note;
				}
			}
		});

		return notes;
	} catch (error) {
		typeof error === 'string' && new Notice(error);

		return notes;
	}
}

import type { IGranularity, IPeriodicNoteSettings } from './types';
import { createDailyNote } from './daily';
import { createWeeklyNote } from './weekly';
import { createMonthlyNote } from './monthly';
import { createQuarterlyNote } from './quarterly';
import { createYearlyNote } from './yearly';
import { getDateFromFile, getDateUID, getPeriodicityFromGranularity } from './parse';
import { getNoteSettingsByGranularity } from './settings';
import { get } from 'svelte/store';
import { notesStores } from '@/stores';

export { getDateUID, getDateFromFile, getDateFromPath } from './parse';
export { getTemplateInfo } from './vault';

export type { IGranularity, IPeriodicNoteSettings };
export {
	createDailyNote,
	createMonthlyNote,
	createWeeklyNote,
	createQuarterlyNote,
	createYearlyNote
};
