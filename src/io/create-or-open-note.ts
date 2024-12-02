import { settingsStore } from "@/settings";
import { activeFilepathStore, previewLeafStore } from "@/stores";
import { internalFileModStore } from "@/stores/notes";
import { createConfirmationDialog } from "@/ui/modals/confirmation";
import { capitalize } from "@/utils";
import { type Moment } from "moment";
import { Notice, TFile, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";
import CreateNote from "./CreateNote.svelte";
import { getPeriodicityFromGranularity, replaceTemplateContents } from "./parse";
import { getNormalizedPeriodSettings } from "./settings";
import { type IGranularity } from "./types";
import { ensureFolderExists, getNotePath, getTemplateInfo } from "./vault";
import { extractAndReplaceTODOItems } from "./utils";
import { ViewManager } from "@/ui";

export async function createOrOpenNote({
    leaf,
    date,
    granularity,
    openState,
    confirmBeforeCreateOverride = get(settingsStore).shouldConfirmBeforeCreate,
    isPreview,
    openNotesInPreviewOverride = true,
}: {
    leaf: WorkspaceLeaf | null;
    date: Moment;
    openState?: Record<string, any>;
    granularity: IGranularity;
    confirmBeforeCreateOverride?: boolean;
    isPreview?: boolean;
    openNotesInPreviewOverride?: boolean;
}) {
    const { settings: { selectedFormat } } = getNormalizedPeriodSettings(granularity);

    const filename = date.format(selectedFormat.value);
    const normalizedPath = getNotePath(granularity, date);

    console.log("[createOrOpenNote()] > normalizedPath: ", normalizedPath);
    let file = window.app.vault.getAbstractFileByPath(normalizedPath)
    console.log("[createOrOpenNote()] > file: ", file);

    async function openFile(file: TFile | null) {
        if (file) {
            if (openNotesInPreviewOverride && (isPreview || get(settingsStore).preview.openNotesInPreview)) {
                ViewManager.revealView();
                ViewManager.initPreview(file);
            } else {
                await leaf?.openFile(file, openState);
            }
            activeFilepathStore.set(file.path);
        }
    }

    if (file) {
        await openFile(file);
    } else {
        const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
        console.log("[io-create-or-open-note]", granularity, selectedFormat.value, date, filename);

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
                    console.log('createOrOpenNote() > onAccept() > file: ', file);
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
            console.log('🤯🔥🤯 createOrOpenNote() > file: 🤯🔥🤯', file);
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
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new Notice(`Failed to create file: '${normalizedPath}'`);

        return null
    }
}
