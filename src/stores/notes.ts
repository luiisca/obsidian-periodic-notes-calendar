import { type IGranularity } from '@/io';
import type { TFile } from 'obsidian';
import { type Writable, writable } from 'svelte/store';

const notesStores: Record<IGranularity, Writable<Record<string, { file: TFile; sticker: string | null }>>> = {
    day: writable({}),
    week: writable({}),
    month: writable({}),
    quarter: writable({}),
    year: writable({})
};

const activeFileIdStore = writable<string | null>(null);

export { notesStores, activeFileIdStore };
