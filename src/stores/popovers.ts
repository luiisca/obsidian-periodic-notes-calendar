import type { IGranularity } from "@/io";
import { type Moment } from "moment";
import { TFile } from "obsidian";

export type TStickerComponentProps = {
    note: TFile | undefined | null,
    date: Moment | null,
    granularity: IGranularity | null
}
