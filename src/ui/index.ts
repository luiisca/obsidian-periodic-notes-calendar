import { type Moment } from "moment";
import type { App } from "obsidian";

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
export * from './components';
export type { ICalendarSource, IDot, IDayMetadata, ISourceSettings };
