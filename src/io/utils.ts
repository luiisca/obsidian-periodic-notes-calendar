import { granularities } from "@/constants";
import { notesStores } from "@/stores";
import { doTagsIncludeEmoji } from "@/ui/utils";
import { Moment } from "moment";
import { normalizePath, Notice, TFile, TFolder, Vault } from "obsidian";
import { get } from "svelte/store";
import { getNoteDateUID, getPeriodicityFromGranularity } from "./parse";
import { getNoteSettings } from "./settings";
import { IGranularity } from "./types";
import { isValidPeriodicNote } from "./validation";

export function getNoteFromStore({
    date,
    granularity
}: {
    date: Moment;
    granularity: IGranularity;
}): TFile | undefined {
    const notesStore = get(notesStores[granularity]);

    return notesStore[getNoteDateUID({ date, granularity })]?.file;
}

/**
    * @note dependent on `getNoteSettings`, must only be called after periodic notes plugin is fully loaded
*/
export function storeAllVaultPeriodicNotes() {
    const noteSettings = getNoteSettings();
    let uniqueFolders: Record<string, IGranularity[]> = {};
    granularities.forEach((granularity) => {
        const crrGranularityFolder = noteSettings[granularity].folder;
        if (!uniqueFolders[crrGranularityFolder]) {
            uniqueFolders[crrGranularityFolder] = []
        }
        uniqueFolders[crrGranularityFolder].push(granularity)
    })

    console.log("📂 uniqueFolders", uniqueFolders)

    Object.entries(uniqueFolders).forEach(([uniqueFolder, granularities]) => {
        try {
            const notesFolder = window.app.vault.getAbstractFileByPath(normalizePath(uniqueFolder)) as TFolder;

            if (!notesFolder) {
                throw new Error(
                    `Unable to locate ${granularities.map((g) => getPeriodicityFromGranularity(g)).join(', ')} 
                    notes folder. Check your plugin's settings or restart calendar plugin.`
                );
            }

            Vault.recurseChildren(notesFolder, (note) => {
                if (note instanceof TFile) {
                    const { isValid, granularity, date } = isValidPeriodicNote(note.basename, granularities);

                    if (isValid) {
                        const noteDateUID = getNoteDateUID({ date, granularity });
                        const hasEmoji = doTagsIncludeEmoji(window.app.metadataCache.getFileCache(note)?.tags);

                        // update store
                        notesStores[granularity].update((values) => ({
                            ...values,
                            [noteDateUID]: {
                                file: note,
                                sticker: hasEmoji ? hasEmoji.emoji : null
                            }
                        }))
                    }
                }
            });
        } catch (error) {
            typeof error === 'string' && new Notice(error);
        }
    })

    console.log("✅ all store notes ✅ \n", Object.values(notesStores).map((s) => get(s)));
}

