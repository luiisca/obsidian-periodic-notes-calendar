import { type Moment } from "moment";
import type { App } from "obsidian";

import Calendar from "./components/Calendar.svelte";
import type {
    ICalendarSource,
    IDot,
    IDayMetadata,
    ISourceSettings,
} from "./types";

declare global {
    interface Window {
        app: App;
        moment: Moment;
    }
}

export * from './notice'
export { Calendar };
export type { ICalendarSource, IDot, IDayMetadata, ISourceSettings };
