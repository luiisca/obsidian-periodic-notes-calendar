import { WorkspaceLeaf } from "obsidian";
import { writable } from "svelte/store";

type TMainLeaf = {
    leaf?: WorkspaceLeaf | null,
    visible?: boolean | null,
    reopened?: boolean | null,
    splitPos?: "left" | "root" | "right" | null,
}
type TPreviewLeaf = {
    leaf?: WorkspaceLeaf | null,
    filepath?: string | null,
    visible?: boolean | null,
    maximized?: boolean | null,
    splitPos?: "left" | "root" | "right" | null,
    splitDir?: "vertical" | "horizontal" | null,
    isOpenBttnVisible?: boolean
}

export const mainLeafStore = writable<TMainLeaf | null>(null);
export const previewLeafStore = writable<TPreviewLeaf | null>(null)

/** 
    * set to true at the beginning and false at the end of a fn that may internally trigger on-layout event to signal a preview is being processed and it shouldn't be restarted or cleared if any
    * its subcalls happen to trigger on-layout */
export const processingPreviewChangeStore = writable(false);
