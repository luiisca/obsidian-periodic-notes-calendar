import { settingsStore } from "@/settings";
import { activeFileStore, internalFileModStore } from "@/stores/notes";
import { createConfirmationDialog } from "@/ui/modals/confirmation";
import { Notice, TAbstractFile, TFile, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";
import CreateNote from "./CreateNote.svelte";
import { getPeriodicityFromGranularity, replaceTemplateContents } from "./parse";
import { getNormalizedPeriodSettings } from "./settings";
import { type IGranularity } from "./types";
import { extractAndReplaceTODOItems } from "./utils";
import { ensureFolderExists, getNotePath, getTemplateInfo } from "./vault";
import { ViewManager } from "@/ui";
import { PluginService } from "@/app-service";

export async function createOrOpenNote({
    leaf,
    date,
    granularity,
    openState,
    confirmBeforeCreateOverride = get(settingsStore).shouldConfirmBeforeCreate,
    openInPreview,
}: {
    leaf: WorkspaceLeaf | null;
    date: moment.Moment;
    openState?: Record<string, any>;
    granularity: IGranularity;
    confirmBeforeCreateOverride?: boolean;
    openInPreview?: boolean;
}) {
    const { settings: { selectedFormat } } = getNormalizedPeriodSettings(granularity);

    const filename = date.format(selectedFormat.value);
    const normalizedPath = getNotePath(granularity, date);

    // console.log("🎉🎉🎉 [createOrOpenNote()] 🎉🎉🎉");
    // console.table({
    //     granularity,
    //     selectedFormat,
    //     filename,
    //     normalizedPath,
    //     date,
    //     formattedDate: date.format("YYYY-MM-DD, [W]W, [w]w")
    // })

    async function openFile(file: TFile | undefined | null) {
        if (file) {
            if (openInPreview) {
                ViewManager.revealView();
                ViewManager.tryInitPreview(file, true);
            } else {
                await leaf?.openFile(file, openState);
            }
            activeFileStore.update(d => {
                if (d) {
                    d.file = file;
                }
                return d
            })
        }
    }

    let file = PluginService.getPlugin()?.app.vault.getAbstractFileByPath(normalizedPath)
    if (file && file instanceof TFile) {
        await openFile(file);
    } else if (file && !(file instanceof TFile)) {
        return new Notice(`Not a file: ${normalizedPath}`);
    } else {
        const periodicity = getPeriodicityFromGranularity(granularity);

        if (confirmBeforeCreateOverride) {
            createConfirmationDialog({
                title: `New ${periodicity} note`,
                text: `File ${filename} does not exist. Would you like to create it?`,
                note: {
                    Component: CreateNote,
                    props: {
                        granularity
                    }
                },
                cta: 'Create',
                onAccept: async (dontAskAgain) => {
                    const newFile = await createNote(granularity, date);
                    await openFile(newFile);

                    if (dontAskAgain) {
                        settingsStore.update((settings) => ({
                            ...settings,
                            shouldConfirmBeforeCreate: false
                        }));
                    }
                }
            });
        } else {
            const newFile = await createNote(granularity, date);
            await openFile(newFile);
        }
    }
}

export async function createNote(granularity: IGranularity, date: moment.Moment) {
    const { settings: { templatePath, selectedFormat } } = getNormalizedPeriodSettings(granularity);

    const normalizedPath = getNotePath(granularity, date);
    await ensureFolderExists(normalizedPath);
    const [templateContents, IFoldInfo] = await getTemplateInfo(templatePath);

    try {
        internalFileModStore.set("created");

        const file = await PluginService.getPlugin()?.app.vault.create(
            normalizedPath,
            replaceTemplateContents(date, selectedFormat.value, templateContents)
        );
        if (!file || !(file instanceof TFile)) return;

        await extractAndReplaceTODOItems(date, granularity, file);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (PluginService.getPlugin()?.app as any).foldManager.save(file, IFoldInfo);

        settingsStore.addFilepath(normalizedPath, selectedFormat.value)
        internalFileModStore.set(null)

        return file;
    } catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new Notice(`Failed to create file: '${normalizedPath}'`);

        return null
    }
}
