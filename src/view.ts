import { App, ItemView, WorkspaceLeaf, normalizePath } from 'obsidian';

import View from './View.svelte';
import type { Dayjs } from 'dayjs';
import { VIEW } from './calendar-ui/context';
import { settingsStore } from './stores';
import type { ISettings } from './settings';
import { createDailyNote } from './calendar-io';

export const VIEW_TYPE_EXAMPLE = 'example-view';

type TOnClick = ({ date, isNewSplit }: { date: Dayjs; isNewSplit: boolean }) => Promise<void>;
type TOnHover = ({
	date,
	targetEl,
	isMetaPressed
}: {
	date: Dayjs;
	targetEl: EventTarget;
	isMetaPressed: boolean;
}) => void;
type TOnContextMenu = ({ date, event }: { date: Dayjs; event: MouseEvent }) => void;

export interface ICalendarViewCtx {
	app: App;
	eventHandlers: {
		day: {
			onClick: TOnClick;
			onHover: TOnHover;
			onContextMenu: TOnContextMenu;
		};
		week: {
			onClick: TOnClick;
			onHover: TOnHover;
			onContextMenu: TOnContextMenu;
		};
	};
}

export class CalendarView extends ItemView {
	private view: View;
	private settings: ISettings;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);

		this.registerEvent(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(<any>this.app.workspace).on('periodic-notes:settings-updated', this.onNoteSettingsUpdate)
		);

		this.registerEvent(this.app.vault.on('create', this.onFileCreated));
		this.registerEvent(this.app.vault.on('delete', this.onFileDeleted));
		this.registerEvent(this.app.vault.on('modify', this.onFileModified));
		this.registerEvent(this.app.workspace.on('file-open', this.onFileOpen));

		this.register(
			settingsStore.subscribe((settings) => {
				this.settings = settings;
			})
		);
	}

	onClose(): Promise<void> {
		console.log('On close view❌');
		if (this.view) {
			this.view.$destroy();
		}

		return Promise.resolve();
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return 'Example view';
	}

	async onOpen() {
		console.log('On open view👐');

		const context = new Map<symbol, ICalendarViewCtx>();
		context.set(VIEW, {
			app: this.app,
			eventHandlers: {
				day: {
					onClick: this.onClickDay,
					onHover: this.onHoverDay,
					onContextMenu: this.onContextMenuDay
				},
				week: {
					onClick: this.onClickWeek,
					onHover: this.onHoverWeek,
					onContextMenu: this.onContextMenuWeek
				}
			}
		});

		this.view = new View({
			target: this.contentEl,
			context
		});
	}

	// app.workspace and app.vault event handlers
	private onNoteSettingsUpdate(): void {
		dailyNotes.reindex();
		weeklyNotes.reindex();
		this.updateActiveFile();
	}

	private async onFileDeleted(file: TFile): Promise<void> {
		if (getDateFromFile(file, 'day')) {
			dailyNotes.reindex();
			this.updateActiveFile();
		}
		if (getDateFromFile(file, 'week')) {
			weeklyNotes.reindex();
			this.updateActiveFile();
		}
	}

	private async onFileModified(file: TFile): Promise<void> {
		const date = getDateFromFile(file, 'day') || getDateFromFile(file, 'week');
		if (date && this.calendar) {
			this.calendar.tick();
		}
	}

	private onFileCreated(file: TFile): void {
		if (this.app.workspace.layoutReady && this.calendar) {
			if (getDateFromFile(file, 'day')) {
				dailyNotes.reindex();
				this.calendar.tick();
			}
			if (getDateFromFile(file, 'week')) {
				weeklyNotes.reindex();
				this.calendar.tick();
			}
		}
	}

	public onFileOpen(_file: TFile): void {
		if (this.app.workspace.layoutReady) {
			this.updateActiveFile();
		}
	}

	// Component event handlers
	async onClickDay({ date, isNewSplit }: { date: Dayjs; isNewSplit: boolean }): Promise<void> {
		const { workspace } = window.app;
		await createDailyNote(date);
		// const existingFile = getDailyNote(date, get(dailyNotes));
		// if (!existingFile) {
		// 	// File doesn't exist
		// 	await createDailyNote(date);
		// }

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mode = (this.app.vault as any).getConfig('defaultViewMode');
		const leaf = isNewSplit ? workspace.splitActiveLeaf() : workspace.getUnpinnedLeaf();
		await leaf.openFile(existingFile, { active: true, mode });

		activeFile.setFile(existingFile);
	}

	async onClickWeek({ date, isNewSplit }: { date: Dayjs; isNewSplit: boolean }): Promise<void> {
		const { workspace } = this.app;

		const startOfWeek = date.clone().startOf('week');

		const existingFile = getWeeklyNote(date, get(weeklyNotes));

		if (!existingFile) {
			// File doesn't exist
			tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, (file) => {
				activeFile.setFile(file);
			});
			return;
		}

		const leaf = inNewSplit ? workspace.splitActiveLeaf() : workspace.getUnpinnedLeaf();
		await leaf.openFile(existingFile);

		activeFile.setFile(existingFile);
		workspace.setActiveLeaf(leaf, true, true);
	}

	onHoverDay({
		date,
		targetEl,
		isMetaPressed
	}: {
		date: Dayjs;
		targetEl: EventTarget;
		isMetaPressed: boolean;
	}): void {
		if (!isMetaPressed) {
			return;
		}
		const { format } = getDailyNoteSettings();
		const note = getDailyNote(date, get(dailyNotes));
		this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);
	}

	onHoverWeek({
		date,
		targetEl,
		isMetaPressed
	}: {
		date: Dayjs;
		targetEl: EventTarget;
		isMetaPressed: boolean;
	}): void {
		if (!isMetaPressed) {
			return;
		}
		const note = getWeeklyNote(date, get(weeklyNotes));
		const { format } = getWeeklyNoteSettings();
		this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);
	}

	private onContextMenuDay({ date, event }: { date: Dayjs; event: MouseEvent }): void {
		const note = getDailyNote(date, get(dailyNotes));
		if (!note) {
			// If no file exists for a given day, show nothing.
			return;
		}
		showFileMenu(this.app, note, {
			x: event.pageX,
			y: event.pageY
		});
	}

	private onContextMenuWeek({ date, event }: { date: Dayjs; event: MouseEvent }): void {
		const note = getWeeklyNote(date, get(weeklyNotes));
		if (!note) {
			// If no file exists for a given day, show nothing.
			return;
		}
		showFileMenu(this.app, note, {
			x: event.pageX,
			y: event.pageY
		});
	}

	// Utils
	private updateActiveFile(): void {
		// get activeLeaf view
		const { view } = this.app.workspace.activeLeaf;

		let file = null;
		if (view instanceof FileView) {
			// extract file from view
			file = view.file;
		}
		// save file in store activeFile
		activeFile.setFile(file);

		// rerender calendar to display possible different active file
		if (this.view) {
			this.view.tick();
		}
	}

	public revealActiveNote(): void {
		const { moment } = window;
		const { activeLeaf } = this.app.workspace;

		if (activeLeaf.view instanceof FileView) {
			// Check to see if the active note is a daily-note
			let date = getDateFromFile(activeLeaf.view.file, 'day');
			if (date) {
				this.calendar.$set({ displayedMonth: date });
				return;
			}

			// Check to see if the active note is a weekly-note
			const { format } = getWeeklyNoteSettings();
			date = moment(activeLeaf.view.file.basename, format, true);
			if (date.isValid()) {
				this.calendar.$set({ displayedMonth: date });
				return;
			}
		}
	}
}
