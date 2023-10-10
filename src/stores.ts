import { get, writable } from 'svelte/store';
import { DEFAULT_SETTINGS, type ISettings } from './settings';
import type { TFile } from 'obsidian';
import { getAllDailyNotes, getAllWeeklyNotes } from './calendar-io';

function createDailyNotesStore() {
	let hasError = false;
	const store = writable<Record<string, TFile>>({});
	return {
		reindex: () => {
			console.log('createDailyNotesStore > reindexing')
			try {
				const dailyNotes = getAllDailyNotes();
				// console.log('stores.ts > reindex() > createDailyNotesStore(): ', dailyNotes);
				if (Object.keys(dailyNotes).length === 0) {
					throw new Error('No notes found');
				}
				store.set(dailyNotes);
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

function createWeeklyNotesStore() {
	let hasError = false;
	const store = writable<Record<string, TFile>>({});
	return {
		reindex: () => {
			console.log('createWeeklyNotesStore > reindexing')
			try {
				const weeklyNotes = getAllWeeklyNotes();
				store.set(weeklyNotes);
				hasError = false;
			} catch (err) {
				if (!hasError) {
					// Avoid error being shown multiple times
					console.log('[Calendar] Failed to find weekly notes folder', err);
				}
				store.set({});
				hasError = true;
			}
		},
		...store
	};
}

export const dailyNotesExtStore = createDailyNotesStore();
export const weeklyNotesExtStore = createWeeklyNotesStore();

export const settingsStore = writable<ISettings>(DEFAULT_SETTINGS);

function createSelectedFileStore() {
  const store = writable<string | null>(null);

  return {
    setFile: (id: string) => {
      store.set(id);
	  console.log('createSelectedFileStore > store: ', get(store))
    },
    ...store,
  };
}

export const activeFile = createSelectedFileStore();