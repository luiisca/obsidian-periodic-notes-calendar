import type moment from 'moment';
import type { Moment } from 'moment';
import { normalizePath, type App, TFile, TFolder, Vault, Notice, WorkspaceLeaf } from 'obsidian';

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

	return notesStore[getDateUID(date, granularity)]?.file;
}

// EXPLAN: only used at store.ts > createNotesStore() to reindex notes every time
// a new note is added or deleted or settings change.
export function getAllNotesByGranularity(
	granularity: IGranularity
): Record<string, { file: TFile; sticker: string | null }> {
	// Record<string, {file: TFile; sticker: string}
	const notes: Record<string, { file: TFile; sticker: string | null }> = {};
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
					window.app.vault.cachedRead(note).then((data) => {
						// update store separately to avoid possible slow downs
						const emoji = data.match(/#sticker-([^\s]+)/)?.[1];

						emoji &&
							notesStores[granularity].update((values) => ({
								...values,
								[dateUID]: {
									file: note,
									sticker: emoji
								}
							}));
					});

					notes[dateUID] = {
						file: note,
						sticker: null
					};
				}
			}
		});

		return notes;
	} catch (error) {
		typeof error === 'string' && new Notice(error);

		return notes;
	}
}

export async function tryToCreateNote({
	leaf,
	date,
	granularity,
	confirmBeforeCreateOverride
}: {
	leaf: WorkspaceLeaf;
	date: Moment;
	granularity: IGranularity;
	confirmBeforeCreateOverride?: boolean;
}) {
	const settings = get(settingsStore);
	const openFile = async (file: TFile) => {
		file && (await leaf.openFile(file));
		activeFile.setFile(getDateUID(date, granularity));
	};

	let file = getNoteByGranularity({ date, granularity });

	const confirmBeforeCreate =
		typeof confirmBeforeCreateOverride === 'boolean'
			? confirmBeforeCreateOverride
			: settings.shouldConfirmBeforeCreate;

	if (!file) {
		const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
		const { format } = getNoteSettingsByGranularity(granularity);
		const formattedDate = date.format(format);

		if (confirmBeforeCreate) {
			createConfirmationDialog<TFile | undefined>({
				title: `New ${periodicity} Note`,
				text: `File ${formattedDate} does not exist. Would you like to create it?`,
				note: getOnCreateNoteDialogNoteFromGranularity(granularity),
				cta: 'Create',
				onAccept: async () => {
					file = await noteCreator[granularity](date);
					console.log('tryToCreateNote() > onAccept() > file: ', file);
					file && (await openFile(file));

					return file;
				}
			});
		} else {
			file = await noteCreator[granularity](date);
			file && (await openFile(file));
		}
	} else {
		file && (await openFile(file));
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
import { activeFile, notesStores, settingsStore } from '@/stores';
import { capitalize, getOnCreateNoteDialogNoteFromGranularity } from '@/utils';
import { createConfirmationDialog } from '@/calendar-ui/modals/confirmation';

export { getDateUID, getDateFromFile, getDateFromPath } from './parse';
export { getTemplateInfo } from './vault';

export type { IGranularity, IPeriodicNoteSettings };
export const noteCreator = {
	day: createDailyNote,
	week: createWeeklyNote,
	month: createMonthlyNote,
	quarter: createQuarterlyNote,
	year: createYearlyNote
};
