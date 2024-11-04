import { granularities } from "@/constants";
import { settingsStore, TFormat } from "@/settings";
import { normalizePath, Notice, TFile, TFolder, Vault } from "obsidian";
import { get } from "svelte/store";
import { getPeriodicityFromGranularity } from "./parse";
import { getNormalizedPeriodSettings } from "./settings";
import { type IGranularity } from "./types";
import { isValidPeriodicNote } from "./validation";

export function storeAllVaultPeriodicFilepaths(
    firstRun = false,
    customGranularities = granularities as unknown as IGranularity[],
    customFormats?: Record<string, TFormat>,
) {
    const uniqueFolders: Record<string, IGranularity[]> = {};

    customGranularities.forEach((g) => {
        const { settings: periodSettings } = getNormalizedPeriodSettings(g)
        const periodFolder = periodSettings.folder;

        if (!uniqueFolders[periodFolder]) {
            uniqueFolders[periodFolder] = []
        }
        uniqueFolders[periodFolder].push(g)
    })

    console.log("📂 uniqueFolders", uniqueFolders)

    settingsStore.update((s) => {
        if (firstRun) {
            s.filepaths = {};
            s.filepathsByFormatValue = {};
        }

        Object.entries(uniqueFolders).forEach(([uniqueFolder, customGranularities]) => {
            try {
                const notesFolder = window.app.vault.getAbstractFileByPath(normalizePath(uniqueFolder)) as TFolder;

                if (!notesFolder) {
                    throw new Error(
                        `Unable to locate ${customGranularities.map((g) => getPeriodicityFromGranularity(g)).join(', ')} 
                    notes folder. Check your plugin's settings or restart calendar plugin.`
                    );
                }

                Vault.recurseChildren(notesFolder, async (file) => {
                    if (file instanceof TFile) {
                        if (file.extension !== 'md') return;

                        const { isValid, format } = isValidPeriodicNote(file.basename, customGranularities, customFormats);

                        if (typeof isValid === "boolean") {
                            s.filepaths[file.path] = format.value;
                            if (!(format.value in s.filepathsByFormatValue)) {
                                s.filepathsByFormatValue[format.value] = {}
                            }
                            s.filepathsByFormatValue[format.value]![file.path] = file.path;
                        }
                    }
                });

            } catch (error) {
                typeof error === 'string' && new Notice(error);
            }
        })

        return s
    })
}

export function getStartupNoteGranularity() {
    for (const granularity of granularities) {
        const settings = get(settingsStore).periods[granularity]
        if (settings.enabled && settings.openAtStartup) {
            return granularity
        }
    }
}
