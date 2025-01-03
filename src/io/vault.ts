import { normalizePath, Notice, TFile } from "obsidian";
import { IGranularity } from "./types";
import { Moment } from "moment";
import { getNormalizedPeriodSettings } from "./settings";
import { getSticker, TSticker } from "@/ui/utils";
import { PeriodSettings } from "@/settings";
import { PluginService } from "@/app-service";

interface IFold {
    from: number;
    to: number;
}

interface IFoldInfo {
    folds: IFold[];
}
export type TFileData = {
    file: TFile | null;
    sticker: TSticker | null
}

// Credit: @creationix/path.js
export function join(...partSegments: string[]): string {
    // Split the inputs into a list of path commands.
    let parts: string[] = [];
    for (let i = 0, l = partSegments.length; i < l; i++) {
        parts = parts.concat(partSegments[i].split("/"));
    }
    // Interpret the path commands to get the new resolved path.
    const newParts = [];
    for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i];
        // Remove leading and trailing slashes
        // Also remove "." segments
        if (!part || part === ".") continue;
        // Push new path segments.
        else newParts.push(part);
    }
    // Preserve the initial slash if there was one.
    if (parts[0] === "") newParts.unshift("");
    // Turn back into a single string path.
    return newParts.join("/");
}

export function basename(fullPath: string): string {
    let base = fullPath.substring(fullPath.lastIndexOf("/") + 1);
    if (base.lastIndexOf(".") != -1)
        base = base.substring(0, base.lastIndexOf("."));
    return base;
}

export async function ensureFolderExists(path: string): Promise<void> {
    const dirs = path.replace(/\\/g, "/").split("/");
    dirs.pop(); // remove basename

    if (dirs.length) {
        const dir = join(...dirs);
        if (!PluginService.getPlugin()?.app.vault.getAbstractFileByPath(dir)) {
            await PluginService.getPlugin()?.app.vault.createFolder(dir);
        }
    }
}

async function ensureTemplateExists(path: string) {
    // create directory if it doesn't exist
    await ensureFolderExists(path);

    // create file if it doesnt exist
    if (!PluginService.getPlugin()?.app.vault.getAbstractFileByPath(path)) {
        await PluginService.getPlugin()?.app.vault.create(path, "");
    }
}

export function getNotePath(
    granularity: IGranularity,
    date: Moment,
    customFormat?: PeriodSettings["formats"][0],
    customFolder?: string,
) {
    const { settings: { selectedFormat, folder } } = getNormalizedPeriodSettings(granularity);
    let filename = date.format(customFormat?.value || selectedFormat.value);

    if (!filename.endsWith(".md")) {
        filename += ".md";
    }

    return normalizePath(join(customFolder || folder, filename));
}

export function getFileData(
    granularity: IGranularity | null,
    date: Moment | null,
): TFileData {
    const filePath = granularity && date && getNotePath(granularity, date);
    const file = filePath ? (PluginService.getPlugin()?.app.vault.getAbstractFileByPath(filePath) as TFile) : null;
    const tags = file ? PluginService.getPlugin()?.app.metadataCache.getFileCache(file)?.tags : null;
    const sticker = getSticker(tags)

    return {
        file,
        sticker
    }
}

export async function getTemplateInfo(
    template: string
): Promise<[string, IFoldInfo | null]> {
    const app = PluginService.getPlugin()?.app;

    const normalizedPath = normalizePath(template);
    if (normalizedPath === "/") {
        return Promise.resolve(["", null]);
    }
    await ensureTemplateExists(normalizedPath);

    try {
        // get First file matching given normalizedPath
        const templateFile = app?.vault.getAbstractFileByPath(normalizedPath);
        const contents = await app?.vault.cachedRead(templateFile as TFile) ?? "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const IFoldInfo = (PluginService.getPlugin()?.app as any).foldManager.load(templateFile);
        return [contents, IFoldInfo];
    } catch (err) {
        console.error(
            `Failed to read the daily note template '${normalizedPath}'`,
            err
        );
        new Notice("Failed to read the daily note template");
        return ["", null];
    }
}

export async function modifyFile(file: TFile, updatedContent: string) {
    const app = PluginService.getPlugin()?.app
    const activeEditor = app?.workspace.activeEditor
    const editor = activeEditor?.editor
    if (editor && activeEditor.file === file) {
        editor.setValue(updatedContent)
    } else {
        await app?.vault.process(file, (crrContent) => updatedContent)
    }
}
