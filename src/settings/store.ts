import { writable } from "svelte/store";
import { DEFAULT_SETTINGS, ISettings } from "./constants";

export const settingsStore = writable<ISettings>(DEFAULT_SETTINGS);
