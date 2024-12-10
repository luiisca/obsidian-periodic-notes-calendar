import { writable } from 'svelte/store';

const activeFilepathStore = writable<string | null>(null);
const internalFileModStore = writable<"created" | "renamed" | { modified: number } | "deleted" | null>(null);

export { activeFilepathStore, internalFileModStore };

