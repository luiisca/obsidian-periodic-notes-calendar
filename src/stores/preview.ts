import { TFile, WorkspaceLeaf } from "obsidian";
import { writable } from "svelte/store";

/** 
    * set to true at the beginning and false at the end of a fn that may internally trigger on-layout event to signal a preview is being processed and it shouldn't be restarted or cleared if any
    * its subcalls happen to trigger on-layout */
export const processingPreviewChangeStore = writable(false);
export const mainViewLeafStore = writable<WorkspaceLeaf | null>(null);
export const isMainViewVisibleStore = writable<boolean | null>(null);
export const isMainLeafReopenedStore = writable<boolean | null>(null);
export const previewLeafStore = writable<{ leaf: WorkspaceLeaf | null, file?: TFile | null } | null>(null)
export const isPreviewVisibleStore = writable(false);
export const isPreviewMaximizedStore = writable(false);
export const previewSplitDirectionStore = writable<"vertical" | "horizontal" | null>(null);
export const previewSplitPositionStore = writable<"left" | "root" | 'right' | null>(null);
export const isOpenPreviewBttnVisibleStore = writable<boolean | null>(null);
