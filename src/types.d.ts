import PeriodicNotesCalendarPlugin from "./main";

declare global {
	interface Window {
        plugin: PeriodicNotesCalendarPlugin | null;
	}
}