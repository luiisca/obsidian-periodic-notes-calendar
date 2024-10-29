import { type IGranularity } from '@/io';
import { PeriodSettings } from '@/settings';
import { writable } from 'svelte/store';

const justModFileDataStore = writable<{
    op: "created" | "modified" | "deleted";
    path: string;
    format: PeriodSettings['formats'][0];
    granularity: IGranularity;
} | null>(null)

const activeFilepathStore = writable<string | null>(null);
const internalRenamingStore = writable(false);

export { justModFileDataStore, activeFilepathStore, internalRenamingStore };
