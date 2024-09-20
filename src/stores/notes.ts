import { IGranularity } from '@/io';
import type { TFile } from 'obsidian';
import { Writable, writable } from 'svelte/store';

let notesStores: Record<IGranularity, Writable<Record<string, { file: TFile; sticker: string | null }>>> = {
    day: writable({}),
    week: writable({}),
    month: writable({}),
    quarter: writable({}),
    year: writable({})
};

function createSelectedFileIdStore() {
    const store = writable<string | null>(null);

    return {
        setFile: (id: string) => {
            store.set(id);
            // console.log('createSelectedFileStore > setFile > activeFileUID: ', get(store));
        },
        ...store
    };
}
const activeFileIdStore = createSelectedFileIdStore();

export { notesStores, activeFileIdStore };
