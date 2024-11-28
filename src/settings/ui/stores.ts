import { writable } from "svelte/store";

export const tabs = ["calendar", "periods"] as const;
export const selectedTabStore = writable<typeof tabs[number]>("periods");
