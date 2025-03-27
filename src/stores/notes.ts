import { IGranularity } from '@/io';
import { TFile } from 'obsidian';
import { writable } from 'svelte/store';

type TActiveFile = {
    file: TFile | null;
    date: moment.Moment | null;
    granularity: IGranularity | null;
}
const activeFileStore = writable<TActiveFile | null>({ file: null, date: null, granularity: null });
const timelineParentFileStore = writable<TFile | null>(null);
const internalFileModStore = writable<"created" | "renamed" | { modified: number } | "deleted" | null>(null);

export { activeFileStore, timelineParentFileStore, internalFileModStore };
