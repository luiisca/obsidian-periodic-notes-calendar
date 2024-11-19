import type { IGranularity, TFileData } from "@/io";
import { type Moment } from "moment";
import { TFile, WorkspaceLeaf } from "obsidian";
import { writable } from "svelte/store";

export type TStickerComponentProps = {
    note: TFile | undefined | null,
    date: Moment | null,
    granularity: IGranularity | null
}

export const spFileDataStore = writable<TFileData | null>(null)
export const previewLeafStore = writable<{ leaf: WorkspaceLeaf | null, file: TFile } | null>(null)
