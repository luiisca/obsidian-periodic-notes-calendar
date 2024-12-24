import { settingsStore } from "@/settings";
import { activeFileStore, internalFileModStore } from "@/stores/notes";
import { createConfirmationDialog } from "@/ui/modals/confirmation";
import { capitalize } from "@/utils";
import { type Moment } from "moment";
import { Notice, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";
import CreateNote from "./CreateNote.svelte";
import { getPeriodicityFromGranularity, replaceTemplateContents } from "./parse";
import { getNormalizedPeriodSettings } from "./settings";
import { type IGranularity } from "./types";
import { extractAndReplaceTODOItems } from "./utils";
import { ensureFolderExists, getNotePath, getTemplateInfo } from "./vault";
import { ViewManager } from "@/ui";

export async function createOrOpenNote({
    leaf,
    date,
    granularity,
    openState,
    confirmBeforeCreateOverride = get(settingsStore).shouldConfirmBeforeCreate,
    openInPreview,
}: {
    leaf: WorkspaceLeaf | null;
    date: Moment;
    openState?: Record<string, any>;
    granularity: IGranularity;
    confirmBeforeCreateOverride?: boolean;
    openInPreview?: boolean;
}) {
    const { settings: { selectedFormat } } = getNormalizedPeriodSettings(granularity);

    const filename = date.format(selectedFormat.value);
    const normalizedPath = getNotePath(granularity, date);

    // console.log("[createOrOpenNote()] > normalizedPath: ", normalizedPath);
    let file = window.app.vault.getAbstractFileByPath(normalizedPath)
    // console.log("[createOrOpenNote()] > file: ", file);

    async function openFile(file: TAbstractFile | null) {
        if (file) {
            if (openInPreview) {
                ViewManager.revealView();
                ViewManager.tryInitPreview(file as TFile, true);
            } else {
                await leaf?.openFile(file as TFile, openState);
            }
            activeFileStore.update(d => {
                if (d) {
                    d.file = file as TFile;
                }
                return d
            })
        }
    }

    if (file) {
        await openFile(file);
    } else {
        const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
        // console.log("[io-create-or-open-note]", granularity, selectedFormat.value, date, filename);

        if (confirmBeforeCreateOverride) {
            createConfirmationDialog({
                title: `New ${periodicity} Note`,
                text: `File ${filename} does not exist. Would you like to create it?`,
                note: {
                    Component: CreateNote,
                    props: {
                        granularity
                    }
                },
                cta: 'Create',
                onAccept: async (dontAskAgain) => {
                    file = await createNote(granularity, date);
                    // console.log('createOrOpenNote() > onAccept() > file: ', file);
                    await openFile(file);

                    if (dontAskAgain) {
                        settingsStore.update((settings) => ({
                            ...settings,
                            shouldConfirmBeforeCreate: false
                        }));
                    }
                }
            });
        } else {
            file = await createNote(granularity, date);
            // console.log('🤯🔥🤯 createOrOpenNote() > file: 🤯🔥🤯', file);
            await openFile(file);
        }
    }
}

export async function createNote(granularity: IGranularity, date: Moment) {
    const { settings: { templatePath, selectedFormat } } = getNormalizedPeriodSettings(granularity);

    const normalizedPath = getNotePath(granularity, date);
    await ensureFolderExists(normalizedPath);
    const [templateContents, IFoldInfo] = await getTemplateInfo(templatePath);

    try {
        internalFileModStore.set("created");

        const file = await window.app.vault.create(
            normalizedPath,
            replaceTemplateContents(date, selectedFormat.value, templateContents)
        );
        await extractAndReplaceTODOItems(date, granularity, file);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.app as any).foldManager.save(file, IFoldInfo);

        settingsStore.addFilepath(normalizedPath, selectedFormat.value)
        internalFileModStore.set(null)

        return file;
    } catch (err) {
        // console.error(`Failed to create file: '${normalizedPath}'`, err);
        new Notice(`Failed to create file: '${normalizedPath}'`);

        return null
    }
}
