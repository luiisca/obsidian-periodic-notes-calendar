import { writable } from 'svelte/store';
import { DEFAULT_SETTINGS, type ISettings } from './settings';
import type { TFile } from 'obsidian';
import { getAllNotesByGranularity, type IGranularity } from './calendar-io';
import { YEARS_RANGE_SIZE, granularities } from './constants';
import type { Moment } from 'moment';

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

type IRanges = `${string}-${string}`[];
function createYearsRangesStore() {
	console.log('stores.ts > createYearsRangesStore() 🏪');
	const store = writable<{
		ranges: IRanges;
		todayRange: `${string}-${string}`;
		crrRangeIndex: number;
	}>();

	const defaultStart = DEFAULT_SETTINGS.yearsRangesStart;
	const crrYear = window.moment().year();
	const ranges: IRanges = [];
	let lastRangeYear = 0;

	while (crrYear > lastRangeYear) {
		if (ranges.length === 0) {
			ranges.push(`${defaultStart}-${defaultStart + YEARS_RANGE_SIZE - 1}`);
			lastRangeYear = defaultStart + YEARS_RANGE_SIZE - 1;
		} else {
			const lastYear = ranges[ranges.length - 1].split('-')[1];
			ranges.push(`${lastYear}-${+lastYear + YEARS_RANGE_SIZE - 1}`);
			lastRangeYear = +lastYear + YEARS_RANGE_SIZE - 1;
		}
	}

	for (const [i, range] of ranges.entries()) {
		const [start, end] = range.split('-');

		if (crrYear >= +start && crrYear <= +end) {
			store.update((values) => ({
				...values,
				todayRange: range,
				crrRangeIndex: i
			}));

			break;
		}
	}

	store.update((values) => ({
		...values,
		ranges
	}));

	return {
		addNewRange: ({ year, where }: { year: number; where: 'before' | 'after' }) => {
			if (where === 'before') {
				store.update((values) => {
					const newRanges = values.ranges;
					newRanges.unshift(`${year - YEARS_RANGE_SIZE + 1}-${year}`);

					return {
						...values,
						ranges: newRanges
					};
				});

				return;
			}

			if (where === 'after') {
				store.update((values) => {
					const newRanges = values.ranges;
					newRanges.push(`${year}-${year + YEARS_RANGE_SIZE - 1}`);

					return {
						...values,
						ranges: newRanges
					};
				});

				return;
			}
		},
		updateCrrRangeIndex: ({ modifier }: { modifier: number }) => {
			yearsRanges.update((values) => ({
				...values,
				crrRangeIndex: values.crrRangeIndex + modifier
			}));
		},
		...store
	};
}

type TNotesStore = Record<IGranularity, ReturnType<typeof createNotesStore>>;
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
export const yearsRanges = createYearsRangesStore();
