import DailyNoteFlexPlugin from "./main";

declare global {
	interface Window {
        plugin: DailyNoteFlexPlugin | null;
	}
}