import { type IGranularity } from '@/io';
import { PeriodSettings } from '@/settings';
import { writable } from 'svelte/store';

const justModFileDataStore = writable<{
    op: "created" | "modified" | "deleted";
    path: string;
    format: PeriodSettings['formats'][0];
    granularity: IGranularity;
} | {
    op: "renamed";
    old: {
        granularity: IGranularity;
        format: PeriodSettings['formats'][0];
    };
    new: {
        isValid: boolean;
        granularity: IGranularity;
        format: PeriodSettings['formats'][0];
    }
} | null>(null)

const activeFilepathStore = writable<string | null>(null);

export { activeFilepathStore, justModFileDataStore };

