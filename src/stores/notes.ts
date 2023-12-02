import { getAllNotesByGranularity, type IGranularity } from '@/calendar-io';
import { granularities } from '@/constants';
import type { TFile } from 'obsidian';
import { writable, type Writable } from 'svelte/store';

type TNotesStore = Record<string, { file: TFile; sticker: string | null }>;
function createNotesStore(granularity: IGranularity) {
	let hasError = false;

	const store = writable<TNotesStore>({});

	// index all existing notes
	return {
		index: () => {
			try {
				const notes = getAllNotesByGranularity(granularity);
				console.log(`createNotesStore(${granularity}) > notes: `, notes);
				if (Object.keys(notes).length === 0) {
					throw new Error('No notes found');
				}
				store.set(notes);
			} catch (err) {
				if (!hasError) {
					// Avoid error being shown multiple times
					console.warn('[Calendar] Failed to find daily notes folder', err);
				}
				store.set({});
				hasError = true;
			}
		},
		...store
	};
}
type TNotesStores = Record<IGranularity, ReturnType<typeof createNotesStore>>;
const notesStores: TNotesStores = {} as TNotesStores;
granularities.forEach((granularity) => {
	const notesExtStore = createNotesStore(granularity);

	notesStores[granularity] = notesExtStore;
});

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
const activeFile = createSelectedFileStore();

export type { TNotesStore };
export { notesStores, activeFile };
