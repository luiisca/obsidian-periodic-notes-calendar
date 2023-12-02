import type { IGranularity } from "@/calendar-io";
import { writable } from "svelte/store";

// update props of static sticker popover component
const stickerPopoverNoteDateUIDStore = writable('');
const stickerPopoverCrrGranularity = writable<IGranularity>();

export {
    stickerPopoverNoteDateUIDStore,
    stickerPopoverCrrGranularity
}