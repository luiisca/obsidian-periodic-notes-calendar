import type { IGranularity } from "@/io";
import type { Moment } from "moment";
import type { TFile } from "obsidian";
import { Writable } from "svelte/store";

export interface IDot {
    isFilled: boolean;
}

export type IHTMLAttributes = Record<string, string | number | boolean>;

export interface IEvaluatedMetadata {
    value: number | string;
    goal?: number;
    dots: IDot[];
    attrs?: IHTMLAttributes;
}

export type ISourceDisplayOption = "calendar-and-menu" | "menu" | "none";

export interface ISourceSettings {
    color: string;
    display: ISourceDisplayOption;
    order: number;
}

export interface IDayMetadata
    extends ICalendarSource,
    ISourceSettings,
    IEvaluatedMetadata { }

export interface ICalendarSource {
    id: string;
    name: string;
    description?: string;

    getMetadata?: (
        granularity: IGranularity,
        date: Moment,
        file: TFile
    ) => Promise<IEvaluatedMetadata>;

    defaultSettings: Record<string, string | number>;
    registerSettings?: (
        containerEl: HTMLElement,
        settings: ISourceSettings,
        saveSettings: (settings: Partial<ISourceSettings>) => void
    ) => void;
}

export type WindowEventHandler<K extends keyof WindowEventMap> = (ev: WindowEventMap[K]) => void;

export type TWindowEvents = {
    [K in keyof WindowEventMap]?: WindowEventHandler<K>;
};


export interface INotesContext {
    triggerRerender: Writable<number>;
}
