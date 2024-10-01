import type { IGranularity } from "@/io";
import { type Moment } from "moment";
import { TFile } from "obsidian";
import { writable } from "svelte/store";

export type TStickerComponentProps = {
    note: TFile | undefined | null,
    date: Moment | null,
    granularity: IGranularity | null
}
export const stickerComponentPropsStore = writable<TStickerComponentProps>({
    note: null,
    date: null,
    granularity: null
});
