import type { Menu } from 'obsidian';
import { writable } from 'svelte/store';
import type PeriodicNotesCalendarPlugin from '../main';

export * from './dates';
export * from './locale';
export * from './notes';
export * from './popovers';
export * from './preview';

export const pluginClassStore = writable<PeriodicNotesCalendarPlugin>();
export const crrFileMenu = writable<Menu | null>(null);
export const rerenderStore = writable({ rerender: false });
export const themeStore = writable<"light" | "dark" | null>(null);
