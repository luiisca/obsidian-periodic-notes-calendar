import { TFile, WorkspaceLeaf } from "obsidian";
import { writable } from "svelte/store";

export const previewLeafStore = writable<{ leaf: WorkspaceLeaf | null, file: TFile | null } | null>(null)
/** 
    * set to true at the beginning and false at the end of a fn that may internally trigger on-layout event to signal a preview is being processed and it shouldn't be restarted or cleared if any
    * its subcalls happen to trigger on-layout */
export const processingPreviewChangeStore = writable(false);
export const isPreviewMaximizedStore = writable(false);
export const previewSplitDirectionStore = writable<"vertical" | "horizontal" | null>(null);
