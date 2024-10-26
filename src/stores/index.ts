import type { Menu } from 'obsidian';
import { writable } from 'svelte/store';
import type PeriodicNotesCalendarPlugin from '../main';

export { displayedDateStore, yearsRanges } from './dates';
export {
    localeDataStore, setupLocale, updateLocale, updateWeekdays, updateWeekStart
} from './locale';
export { activeFilepathStore } from './notes';
export * from './popovers';
export const pluginClassStore = writable<PeriodicNotesCalendarPlugin>();
export const crrFileMenu = writable<Menu | null>(null);
export const rerenderStore = writable({ rerender: false });
export const themeStore = writable<"light" | "dark" | null>(null);
