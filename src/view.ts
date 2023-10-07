import { App, ItemView, TAbstractFile, TFile, WorkspaceLeaf, normalizePath } from 'obsidian';

import View from './View.svelte';
import type { Dayjs } from 'dayjs';
import { VIEW } from './calendar-ui/context';
import { dailyNotesExtStore, settingsStore, weeklyNotesExtStore } from './stores';
import type { ISettings } from './settings';
import {
	createDailyNote,
	getDailyNote,
	getDailyNoteSettings,
	getDateFromFile
} from './calendar-io';
import { get } from 'svelte/store';
import { createConfirmationDialog } from './calendar-ui/modal';
import type { Moment } from 'moment';

export const VIEW_TYPE_EXAMPLE = 'example-view';

type TOnClick = ({ date, isNewSplit }: { date: Moment; isNewSplit: boolean }) => Promise<void>;
type TOnHover = ({
	date,
	targetEl,
	isMetaPressed
}: {
	date: Moment;
	targetEl: EventTarget;
	isMetaPressed: boolean;
}) => void;
type TOnContextMenu = ({ date, event }: { date: Moment; event: MouseEvent }) => void;

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

		this.registerEvent(
			this.app.vault.on('create', (file: TAbstractFile) => this.onFileCreated(file as TFile))
		);
		this.registerEvent(
			this.app.vault.on('delete', (file: TAbstractFile) => this.onFileDeleted(file as TFile))
		);
		this.registerEvent(
			this.app.vault.on('modify', (file: TAbstractFile) => this.onFileModified(file as TFile))
		);
		this.registerEvent(this.app.workspace.on('file-open', () => this.onFileOpen()));

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
					onClick: this.onClickDay.bind(this),
					onHover: this.onHoverDay.bind(this),
					onContextMenu: this.onContextMenuDay.bind(this)
				},
				week: {
					onClick: this.onClickWeek.bind(this),
					onHover: this.onHoverWeek.bind(this),
					onContextMenu: this.onContextMenuWeek.bind(this)
				}
			}
		});

		this.view = new View({
			target: this.contentEl,
			context
		});
	}

	// // app.workspace and app.vault event handlers
	private onNoteSettingsUpdate(): void {
		dailyNotesExtStore.reindex();
		weeklyNotesExtStore.reindex();
		this.updateActiveFile();
	}

	private async onFileDeleted(file: TFile): Promise<void> {
		if (getDateFromFile(file, 'day')) {
			dailyNotesExtStore.reindex();
			this.updateActiveFile();
		}
		if (getDateFromFile(file, 'week')) {
			weeklyNotesExtStore.reindex();
			this.updateActiveFile();
		}
	}

	private async onFileModified(file: TFile): Promise<void> {
		const date = getDateFromFile(file, 'day') || getDateFromFile(file, 'week');
		if (date && this.view) {
			this.view.tick();
		}
	}

	private onFileCreated(file: TFile) {
		if (this.app.workspace.layoutReady && this.view) {
			if (getDateFromFile(file, 'day')) {
				dailyNotesExtStore.reindex();
				// this.view.tick();
			}
			if (getDateFromFile(file, 'week')) {
				weeklyNotesExtStore.reindex();
				// this.view.tick();
			}
		}
	}

	public onFileOpen() {
		if (this.app.workspace.layoutReady) {
			this.updateActiveFile();
		}
	}

	// Component event handlers
	async onClickDay({ date, isNewSplit }: { date: Moment; isNewSplit: boolean }): Promise<void> {
		const { workspace } = window.app;

		const { format } = getDailyNoteSettings();
		const filename = date.format(format);

		let file = getDailyNote(date);
		console.log('onClickDay, existingFile, format: ', file, format);

		if (!file) {
			// File doesn't exist
			if (this.settings.shouldConfirmBeforeCreate) {
				createConfirmationDialog<TFile | undefined>({
					cta: 'Create',
					onAccept: async () => (file = await createDailyNote(date)),
					text: `File ${filename} does not exist. Would you like to create it?`,
					title: 'New Daily Note'
				});
			} else {
				file = await createDailyNote(date);
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mode = (this.app.vault as any).getConfig('defaultViewMode');
		const leaf = isNewSplit ? workspace.splitActiveLeaf() : workspace.getUnpinnedLeaf();
		console.log('ONCLICKDAY 🚴: mode & leaf', mode, leaf);
		console.log('onClickDay(), file: ', file);

		file && await leaf.openFile(file, { active: true, mode });

		// activeFile.setFile(existingFile || newFile);
	}

	async onClickWeek({ date, isNewSplit }: { date: Moment; isNewSplit: boolean }): Promise<void> {
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
		date: Moment;
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
		date: Moment;
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

	private onContextMenuDay({ date, event }: { date: Moment; event: MouseEvent }): void {
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

	private onContextMenuWeek({ date, event }: { date: Moment; event: MouseEvent }): void {
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
