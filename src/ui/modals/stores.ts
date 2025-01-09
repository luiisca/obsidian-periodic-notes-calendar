import { writable, Writable } from "svelte/store";

export const deletedFilesCountStore: Writable<number> = writable(0);
export const movedFilesCountStore: Writable<number> = writable(0);
