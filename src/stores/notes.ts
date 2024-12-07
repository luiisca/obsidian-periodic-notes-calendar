import { IGranularity } from '@/io';
import { Moment } from 'moment';
import { writable } from 'svelte/store';

export interface ILastOpenedFileValidationData {
    path: string,
    isValid: boolean | null,
    granularity: IGranularity | null,
    date: Moment | null
}
const activeFilepathStore = writable<string | null>(null);
const lastOpenedFileValidationDataStore = writable<ILastOpenedFileValidationData | null>(null);
const internalFileModStore = writable<"created" | "renamed" | { modified: number } | "deleted" | null>(null);

export { activeFilepathStore, lastOpenedFileValidationDataStore, internalFileModStore };
