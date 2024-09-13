import { notesStores } from "@/stores";
import { Moment } from "moment";
import { normalizePath, Notice, TFile, TFolder, Vault } from "obsidian";
import { get } from "svelte/store";
import { getDateFromFile, getDateUID, getPeriodicityFromGranularity } from "./parse";
import { getNoteSettingsByPeriodicity } from "./settings";
import { IGranularity } from "./types";
import { logger } from "@/utils";

export function getNoteFromStore({
    date,
    granularity
}: {
    date: Moment;
    granularity: IGranularity;
}): TFile | undefined {
    const notesStore = get(notesStores[granularity]);

    return notesStore[getDateUID({ date, granularity })]?.file;
}

/**
    * @note dependent on `getNoteSettingsByPeriodicity`, must only be called after periodic notes plugin is fully loaded
*/
export function getAllVaultNotes(
    granularity: IGranularity
): Record<string, { file: TFile; sticker: string | null }> {
    const notes: Record<string, { file: TFile; sticker: string | null }> = {};
    try {
        const { folder, format } = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity));
        logger("io-utils-getAllVaultNotes", granularity, format);

        const notesFolder = window.app.vault.getAbstractFileByPath(normalizePath(folder)) as TFolder;

        if (!notesFolder) {
            throw new Error(
                `Unable to locate the ${getPeriodicityFromGranularity(
                    granularity
                )} notes folder. Check your plugin's settings or restart calendar plugin.`
            );
        }

        Vault.recurseChildren(notesFolder, (note) => {
            // console.log(`getAllVaultNotes() > Vault.recurseChildren(${notesFolder}) > note: `, note)

            if (note instanceof TFile) {
                // if file name maps to a valid moment date, it is saved in store.
                // console.log(`getAllVaultNotes(${granularity}) > note: `, note.name);
                const date = getDateFromFile(note, granularity);

                if (date) {
                    const dateUID = getDateUID({ date, granularity });
                    window.app.vault.cachedRead(note).then((data) => {
                        // update store separately to avoid possible slow downs
                        const emoji = data.match(/#sticker-([^\s]+)/)?.[1];

                        if (emoji) {
                            // update notes object from crr context with resolved data in case they resolve before vault operation is done
                            notes[dateUID] = {
                                file: note,
                                sticker: emoji
                            }

                            notesStores[granularity].update((values) => ({
                                ...values,
                                [dateUID]: {
                                    file: note,
                                    sticker: emoji
                                }
                            }));
                        }
                    });

                    notes[dateUID] = {
                        file: note,
                        sticker: null
                    };
                }
            }
        });

        return notes;
    } catch (error) {
        typeof error === 'string' && new Notice(error);

        return notes;
    }
}

