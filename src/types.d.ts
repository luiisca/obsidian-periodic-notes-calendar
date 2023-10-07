import dayjs from "dayjs";
import DailyNoteFlexPlugin from "./main";

declare global {
	interface Window {
		dayjs: typeof dayjs;
        plugin: DailyNoteFlexPlugin | null;
	}
}