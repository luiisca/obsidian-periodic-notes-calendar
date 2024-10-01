import { writable } from "svelte/store";
import { DEFAULT_SETTINGS, type ISettings } from "./constants";

export const settingsStore = writable<ISettings>(DEFAULT_SETTINGS);
