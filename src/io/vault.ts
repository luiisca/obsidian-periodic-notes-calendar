import { normalizePath, Notice, TFile } from "obsidian";

interface IFold {
    from: number;
    to: number;
}

interface IFoldInfo {
    folds: IFold[];
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

async function ensureFolderExists(path: string): Promise<void> {
    const dirs = path.replace(/\\/g, "/").split("/");
    dirs.pop(); // remove basename

    if (dirs.length) {
        const dir = join(...dirs);
        if (!window.app.vault.getAbstractFileByPath(dir)) {
            await window.app.vault.createFolder(dir);
        }
    }
}

async function ensureTemplateExists(path: string) {
    // create directory if it doesn't exist
    await ensureFolderExists(path);

    // create file if it doesnt exist
    if (!window.app.vault.getAbstractFileByPath(path)) {
        await window.app.vault.create(path, "");
    }
}

/**
    * returns a normalized path based on the given directory and filename
    * creates a new directory if it doesn't exist
*/
export async function getNotePath(
    directory: string,
    filename: string
): Promise<string> {
    if (!filename.endsWith(".md")) {
        filename += ".md";
    }
    const path = normalizePath(join(directory, filename));

    await ensureFolderExists(path);

    return path;
}

export async function getTemplateInfo(
    template: string
): Promise<[string, IFoldInfo | null]> {
    const { metadataCache, vault } = window.app;

    if (!template.endsWith(".md")) {
        template += ".md";
    }
    const normalizedPath = normalizePath(template);
    if (normalizedPath === "/") {
        return Promise.resolve(["", null]);
    }
    await ensureTemplateExists(normalizedPath);

    try {
        // get First file matching given normalizedPath
        const templateFile = metadataCache.getFirstLinkpathDest(normalizedPath, "");
        const contents = await vault.cachedRead(templateFile as TFile);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const IFoldInfo = (window.app as any).foldManager.load(templateFile);
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
