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

	return notesStore[getDateUID({ date, granularity })]?.file;
}

export function getAllNotesByGranularity(
	granularity: IGranularity
): Record<string, { file: TFile; sticker: string | null }> {
	const notes: Record<string, { file: TFile; sticker: string | null }> = {};
	try {
		const { folder } = getNoteSettingsByGranularity(granularity);

		const notesFolder = window.app.vault.getAbstractFileByPath(normalizePath(folder)) as TFolder;

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
				// if file name maps to a valid moment date, it is saved in store.
				// console.log(`getAllNotesByGranularity(${granularity}) > note: `, note.name);
				const date = getDateFromFile(note, granularity);

				if (date) {
					const dateUID = getDateUID({ date, granularity });
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
	async function openFile(file: TFile) {
		file && (await leaf.openFile(file));
		activeFile.setFile(getDateUID({ date, granularity }));
	}

	const confirmBeforeCreate =
		typeof confirmBeforeCreateOverride === 'boolean'
			? confirmBeforeCreateOverride
			: get(settingsStore).shouldConfirmBeforeCreate;

	let file = getNoteByGranularity({ date, granularity });
	if (!file) {
		const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
		const { format } = getNoteSettingsByGranularity(granularity);
		const formattedDate = date.format(format);

		const isFormatValid = validateFormat(format, granularity);
		console.log('tryToCreateNote() > isFormatValid: ', isFormatValid);
		if (!isFormatValid) {
			new Notice("Invalid format. Please check your plugin's settings.");

			return;
		}

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
			console.log('🤯🔥🤯 tryToCreateNote() > file: 🤯🔥🤯', file);
			file && (await openFile(file));
			console.log('tryToCreateNote() > notesStore: ', get(notesStores[granularity]));
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
import { getBasename, validateFormat } from './validation';

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
