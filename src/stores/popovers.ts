import type { IGranularity, TFileData } from "@/io";

import { TFile } from "obsidian";
import { writable } from "svelte/store";

export type TStickerComponentProps = {
    note: TFile | undefined | null,
    date: moment.Moment | null,
    granularity: IGranularity | null
}

export const spFileDataStore = writable<TFileData | null>(null)
