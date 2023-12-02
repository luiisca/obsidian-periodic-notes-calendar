import { writable } from 'svelte/store';
import { DEFAULT_SETTINGS, type ISettings } from '../settings';
import type { Menu } from 'obsidian';
import type DailyNoteFlexPlugin from '../main';

export { displayedDateStore, yearsRanges } from './dates';
export {
	localeDataStore,
	updateLocale,
	updateWeekStart,
	updateWeekdays,
	setupLocale
} from './locale';
export { notesStores, activeFile } from './notes';
export type { TNotesStore } from './notes';
export { stickerPopoverCrrGranularity, stickerPopoverNoteDateUIDStore } from './popovers';

export const settingsStore = writable<ISettings>(DEFAULT_SETTINGS);
export const pluginClassStore = writable<DailyNoteFlexPlugin>();
export const crrFileMenu = writable<Menu | null>(null);
