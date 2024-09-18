import { granularities } from '@/constants';
import { getAllVaultNotes, IGranularity } from '@/io';
import type { TFile } from 'obsidian';
import { writable } from 'svelte/store';

type TNotesStore = Record<string, { file: TFile; sticker: string | null }>;
function createNotesStore(granularity: IGranularity) {
    let hasError = false;

    const store = writable<TNotesStore>({});

    return {
        /**
            * @note dependent on `getNoteSettingsByPeriodicity`, must only be called after periodic notes plugin is fully loaded
            */
        index: () => {
            try {
                const notes = getAllVaultNotes(granularity);
                console.log(`createNotesStore(${granularity}) > notes: `, notes);
                if (Object.keys(notes).length === 0) {
                    throw new Error('No notes found');
                }
                store.set(notes);
            } catch (err) {
                if (!hasError) {
                    // Avoid error being shown multiple times
                    console.warn('[Calendar] Failed to find daily notes folder', err);
                }
                store.set({});
                hasError = true;
            }
        },
        ...store
    };
}
export type TNotesStores = Record<IGranularity, ReturnType<typeof createNotesStore>>;
const notesStores: TNotesStores = {} as TNotesStores;
granularities.forEach((granularity) => {
    const notesExtStore = createNotesStore(granularity);

    notesStores[granularity] = notesExtStore;
});

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

export type { TNotesStore };
export { notesStores, activeFileIdStore };
