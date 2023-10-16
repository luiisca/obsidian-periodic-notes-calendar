import { writable } from 'svelte/store';
import { DEFAULT_SETTINGS, type ISettings } from './settings';
import type { TFile } from 'obsidian';
import {
	getAllNotesByGranularity,
	type IGranularity
} from './calendar-io';
import { granularities } from './constants';

function createNotesStore(granularity: IGranularity) {
	let hasError = false;
	const store = writable<Record<string, TFile>>({});

	return {
		reindex: () => {
			console.log(`create${granularity}NotesStore > reindexing`);

			try {
				const notes = getAllNotesByGranularity(granularity);
				if (Object.keys(notes).length === 0) {
					throw new Error('No notes found');
				}
				store.set(notes);
				hasError = false;
			} catch (err) {
				if (!hasError) {
					// Avoid error being shown multiple times
					console.log('[Calendar] Failed to find daily notes folder', err);
				}
				store.set({});
				hasError = true;
			}
		},
		...store
	};
}

type TNotesStore = Record<IGranularity, ReturnType<typeof createNotesStore>>
export const notesStores: TNotesStore = {} as TNotesStore;

granularities.forEach((granularity) => {
	const notesExtStore = createNotesStore(granularity);

	notesStores[granularity] = notesExtStore;
});

export const settingsStore = writable<ISettings>(DEFAULT_SETTINGS);

function createSelectedFileStore() {
	const store = writable<string | null>(null);

	return {
		setFile: (id: string) => {
			store.set(id);
			// console.log('createSelectedFileStore > setFile > activeFileUID: ', get(store));
		},
		...store
	};
}

export const activeFile = createSelectedFileStore();
