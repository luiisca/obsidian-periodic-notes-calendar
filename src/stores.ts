import { writable } from "svelte/store";
import { DEFAULT_SETTINGS, type ISettings } from "./settings";

export const settingsStore = writable<ISettings>(DEFAULT_SETTINGS);