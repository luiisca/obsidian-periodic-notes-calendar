import { App, FileView, ItemView, Menu, TAbstractFile, TFile, WorkspaceLeaf } from 'obsidian';

import View from './View.svelte';
import { VIEW } from './calendar-ui/context';
import { activeFile, notesStores, settingsStore } from './stores';
import type { ISettings } from './settings';
import { getDateFromFile, getDateUID, getNoteByGranularity, noteCreator, tryToCreateNote } from './calendar-io';
import { createConfirmationDialog } from './calendar-ui/modal';
import type { Moment } from 'moment';
import type { IGranularity } from './calendar-io';
import { granularities } from './constants';
import { getNoteSettingsByGranularity } from './calendar-io/settings';
import { capitalize, getOnCreateNoteDialogNoteFromGranularity } from './utils';
import { getPeriodicityFromGranularity } from './calendar-io/parse';
import { get } from 'svelte/store';
import { isMetaPressed } from './calendar-ui/utils';

export const VIEW_TYPE_CALENDAR = 'calendar';

type TOnClick = ({
	date,
	isNewSplit,
	granularity
}: {
	date: Moment;
	isNewSplit: boolean;
	granularity: IGranularity;
}) => Promise<void>;
type TOnHover = ({
	date,
	targetEl,
	isMetaPressed,
	granularity
}: {
	date: Moment;
	targetEl: EventTarget | null;
	isMetaPressed: boolean;
	granularity: IGranularity;
}) => void;
type TOnContextMenu = ({
	date,
	event,
	granularity
}: {
	date: Moment;
	event: MouseEvent;
	granularity: IGranularity;
}) => void;

export interface ICalendarViewCtx {
	app: App;
	eventHandlers: {
		onClick: TOnClick;
		onHover: TOnHover;
		onHoverEnd: () => void;
		onContextMenu: TOnContextMenu;
	};
}

export class CalendarView extends ItemView {
	private view: View;
	private settings: ISettings;
	private triggerLinkHover: () => void;
	private keydownFn: (ev: KeyboardEvent) => void = this.keydownCallback.bind(this);

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
		return VIEW_TYPE_CALENDAR;
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
				onClick: this.onClick.bind(this),
				onHover: this.onHover.bind(this),
				onHoverEnd: this.onHoverEnd.bind(this),
				onContextMenu: this.onContextMenu.bind(this)
			}
		});

		this.view = new View({
			target: this.contentEl,
			context
		});
	}

	// app.workspace and app.vault event handlers
	private onNoteSettingsUpdate(): void {
		granularities.forEach((granularity) => {
			notesStores[granularity].reindex();
		});
		this.updateActiveFile();
	}

	private async onFileDeleted(file: TFile): Promise<void> {
		granularities.forEach((granularity) => {
			if (getDateFromFile(file, granularity)) {
				notesStores[granularity].reindex();
			}
		});
		this.updateActiveFile();
	}

	private async onFileModified(file: TFile): Promise<void> {
		const date = getDateFromFile(file, 'day') || getDateFromFile(file, 'week');
		if (date && this.view) {
			// this.view.tick();
		}
	}

	private onFileCreated(file: TFile) {
		console.log('onFileCreated() > file: ', file);

		if (this.app.workspace.layoutReady && this.view) {
			// do this ifs for every single granularity

			granularities.forEach((granularity) => {
				// only add new note from notes folder to store if a date can be obtained from filename
				if (getDateFromFile(file, granularity)) {
					notesStores[granularity].reindex();
					// this.view.tick();
				}
			});
		}
	}

	public onFileOpen() {
		if (this.app.workspace.layoutReady) {
			this.updateActiveFile();
		}
	}

	// Component event handlers
	async onClick({ date, isNewSplit, granularity }: Parameters<TOnClick>[0]): Promise<void> {
		const { workspace } = window.app;
		const leaf = isNewSplit ? workspace.splitActiveLeaf() : workspace.getUnpinnedLeaf();
		
		tryToCreateNote({leaf, date, granularity})
	}

	onHover({ date, targetEl, isMetaPressed, granularity }: Parameters<TOnHover>[0]): void {
		// console.log('view.ts > onHover(): 📈')
		// this.keydownFn && window.removeEventListener('keydown', this.keydownFn);

		const { format } = getNoteSettingsByGranularity(granularity);
		const note = getNoteByGranularity({ date, granularity });

		this.triggerLinkHover = () =>
			this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);

		if (!isMetaPressed && !this.settings.autoHoverPreview) {
			// TODO: add markdown view popover when ctrlKey pressed after hover
			// window.addEventListener('keydown', this.keydownFn);

			return;
		}

		this.triggerLinkHover();
	}
	onHoverEnd() {
		// remove global event listener
		// console.log('view.ts > onHoverEnd(): 📉')
		// this.keydownFn && window.removeEventListener('keydown', this.keydownFn);
	}

	onContextMenu({ date, event, granularity }: Parameters<TOnContextMenu>[0]): void {
		const note = getNoteByGranularity({ date, granularity });

		if (!note) {
			// If no file exists for a given day, show nothing.
			return;
		}

		const fileMenu = new Menu();
		fileMenu.addItem((item) =>
			item
				.setTitle('Delete')
				.setIcon('trash')
				.onClick(() => {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(<any>app).fileManager.promptForFileDeletion(note);
				})
		);

		app.workspace.trigger('file-menu', fileMenu, note, 'calendar-context-menu', null);
		fileMenu.showAtPosition({
			x: event.pageX,
			y: event.pageY
		});
	}

	// Utils
	private updateActiveFile(): void {
		console.log('CalendarView > on(periodic-notes:settings-updated) > updateActiveFile()');
		// get activeLeaf view
		const activeLeaf = this.app.workspace.activeLeaf;

		let file: TFile | null = null;
		if (activeLeaf?.view && activeLeaf?.view instanceof FileView) {
			// extract file from view
			file = activeLeaf.view.file;

			if (file) {
				let noteDate: Moment | null = null;
				let noteGranularity: IGranularity | null = null;

				for (const granularity of granularities) {
					const date = getDateFromFile(file as TFile, granularity);

					if (date) {
						noteDate = date;
						noteGranularity = granularity;

						break;
					}
				}

				// save file in store activeFile
				if (noteDate && noteGranularity) {
					activeFile.setFile(getDateUID(noteDate, noteGranularity));

					this.view && this.view.tick();
				}
			}
		}
	}

	private keydownCallback(ev: KeyboardEvent) {
		console.log('view.ts > keydownCallback > isMetaPressed() > this: ', this, isMetaPressed(ev));
		if (isMetaPressed(ev)) {
			this.triggerLinkHover();
		}
	}

	// public revealActiveNote(): void {
	// 	const { moment } = window;
	// 	const { activeLeaf } = this.app.workspace;

	// 	if (activeLeaf.view instanceof FileView) {
	// 		// Check to see if the active note is a daily-note
	// 		let date = getDateFromFile(activeLeaf.view.file, 'day');
	// 		if (date) {
	// 			this.calendar.$set({ displayedDate: date });
	// 			return;
	// 		}

	// 		// Check to see if the active note is a weekly-note
	// 		const { format } = getWeeklyNoteSettings();
	// 		date = moment(activeLeaf.view.file.basename, format, true);
	// 		if (date.isValid()) {
	// 			this.calendar.$set({ displayedDate: date });
	// 			return;
	// 		}
	// 	}
	// }
}
