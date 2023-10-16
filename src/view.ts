import { App, FileView, ItemView, TAbstractFile, TFile, WorkspaceLeaf } from 'obsidian';

import View from './View.svelte';
import { VIEW } from './calendar-ui/context';
import { activeFile, notesStores, settingsStore } from './stores';
import type { ISettings } from './settings';
import {
	createDailyNote,
	createWeeklyNote,
	getDateFromFile,
	getDateUID,
	getNoteByGranularity
} from './calendar-io';
import { createConfirmationDialog } from './calendar-ui/modal';
import type { Moment } from 'moment';
import type { IGranularity } from './calendar-io';
import { granularities, granularitiesCapitalize } from './constants';
import { getNoteSettingsByGranularity } from './calendar-io/settings';
import { getOnCreateNoteDialogNoteFromGranularity } from './utils';
import { get } from 'svelte/store';

export const VIEW_TYPE_CALENDAR = 'calendar';

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

type Events = {
	onClick: TOnClick;
	onHover: TOnHover;
	onContextMenu: TOnContextMenu;
};
type TEventHandlers = Record<`${IGranularity}`, Events>;

export interface ICalendarViewCtx {
	app: App;
	eventHandlers: TEventHandlers;
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
		return VIEW_TYPE_CALENDAR;
	}

	getDisplayText() {
		return 'Example view';
	}

	async onOpen() {
		console.log('On open view👐');

		const context = new Map<symbol, ICalendarViewCtx>();
		const getEventHandlers = () => {
			const granularitiesNames = granularitiesCapitalize;
			const events = ['onClick', 'onHover', 'onContextMenu'] as const;

			type TGranularitiesEvents = Record<
				IGranularity,
				Record<(typeof events)[number], Events[keyof Events]>
			>;
			const granularitiesEvents: TGranularitiesEvents = {} as TGranularitiesEvents;

			granularitiesNames.forEach((granularity) => {
				const eventHandlers: Events = {} as Events;
				granularity;

				events.forEach((ev) => {
					const eventHandlerName = (ev + granularity) as `${typeof ev}${typeof granularity}`;

					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					eventHandlers[ev] = this[eventHandlerName].bind(this);
				});

				granularitiesEvents[granularity.toLowerCase() as IGranularity] = eventHandlers;
			});

			return granularitiesEvents;
		};

		context.set(VIEW, {
			app: this.app,
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			eventHandlers: getEventHandlers()
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
	async onClickDay({ date, isNewSplit }: Parameters<TOnClick>[0]): Promise<void> {
		const { workspace } = window.app;
		const leaf = isNewSplit ? workspace.splitActiveLeaf() : workspace.getUnpinnedLeaf();
		const openFile = async (file: TFile) => {
			file && (await leaf.openFile(file));
			activeFile.setFile(getDateUID(date, 'day'));
		};

		let file = getNoteByGranularity({ date, granularity: 'day' });

		if (!file) {
			const { format } = getNoteSettingsByGranularity('day');

			if (this.settings.shouldConfirmBeforeCreate) {
				createConfirmationDialog<TFile | undefined>({
					cta: 'Create',
					onAccept: async () => {
						file = await createDailyNote(date);
						file && (await openFile(file));

						return file;
					},
					text: `File ${date.format(format)} does not exist. Would you like to create it?`,
					note: getOnCreateNoteDialogNoteFromGranularity('day'),
					title: 'New Daily Note'
				});
			} else {
				file = await createDailyNote(date);
				file && (await openFile(file));
			}
		} else {
			file && (await openFile(file));
		}
	}

	async onClickWeek({ date: startOfWeekDate, isNewSplit }: Parameters<TOnClick>[0]): Promise<void> {
		const { workspace } = this.app;
		const leaf = isNewSplit ? workspace.splitActiveLeaf() : workspace.getUnpinnedLeaf();
		const openFile = async (file: TFile) => {
			file && (await leaf.openFile(file));

			activeFile.setFile(getDateUID(startOfWeekDate, 'week'));
		};

		let file = getNoteByGranularity({ date: startOfWeekDate, granularity: 'week' });

		console.log('onClickWeek() > weekStore: ', get(notesStores['week']), 'file: ', file);

		if (!file) {
			const { format } = getNoteSettingsByGranularity('week');

			if (this.settings.shouldConfirmBeforeCreate) {
				createConfirmationDialog<TFile | undefined>({
					title: 'New Daily Note',
					text: `File ${startOfWeekDate.format(
						format
					)} does not exist. Would you like to create it?`,
					note: getOnCreateNoteDialogNoteFromGranularity('week'),
					cta: 'Create',
					onAccept: async () => {
						file = await createWeeklyNote(startOfWeekDate);
						file && (await openFile(file));

						return file;
					}
				});
			} else {
				file = await createWeeklyNote(startOfWeekDate);
				file && (await openFile(file));
			}
		} else {
			file && (await openFile(file));
		}
	}

	async onClickMonth({ date, isNewSplit }: Parameters<TOnClick>[0]): Promise<void> {
		return Promise.resolve();
	}

	async onClickQuarter({ date, isNewSplit }: Parameters<TOnClick>[0]): Promise<void> {
		return Promise.resolve();
	}

	async onClickYear({ date, isNewSplit }: Parameters<TOnClick>[0]): Promise<void> {
		return Promise.resolve();
	}

	onHoverDay({ date, targetEl, isMetaPressed }: Parameters<TOnHover>[0]): void {
		if (!isMetaPressed) {
			return;
		}
		const { format } = getNoteSettingsByGranularity('day');
		const note = getNoteByGranularity({ date, granularity: 'day' });
		this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);
	}

	onHoverWeek({ date, targetEl, isMetaPressed }: Parameters<TOnHover>[0]): void {
		if (!isMetaPressed) {
			return;
		}
		const note = getNoteByGranularity({ date, granularity: 'week' });
		const { format } = getNoteSettingsByGranularity('week');
		this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);
	}
	onHoverMonth({ date, targetEl, isMetaPressed }: Parameters<TOnHover>[0]): void {}
	onHoverQuarter({ date, targetEl, isMetaPressed }: Parameters<TOnHover>[0]): void {}
	onHoverYear({ date, targetEl, isMetaPressed }: Parameters<TOnHover>[0]): void {}

	private onContextMenuDay({ date, event }: { date: Moment; event: MouseEvent }): void {
		const note = getNoteByGranularity({ date, granularity: 'day' });
		if (!note) {
			// If no file exists for a given day, show nothing.
			return;
		}
		// showFileMenu(this.app, note, {
		// 	x: event.pageX,
		// 	y: event.pageY
		// });
	}

	private onContextMenuWeek({ date, event }: { date: Moment; event: MouseEvent }): void {
		const note = getNoteByGranularity({ date, granularity: 'week' });
		if (!note) {
			// If no file exists for a given day, show nothing.
			return;
		}
		// showFileMenu(this.app, note, {
		// 	x: event.pageX,
		// 	y: event.pageY
		// });
	}
	private onContextMenuMonth({ date, event }: Parameters<TOnContextMenu>[0]): void {}
	private onContextMenuQuarter({ date, event }: Parameters<TOnContextMenu>[0]): void {}
	private onContextMenuYear({ date, event }: Parameters<TOnContextMenu>[0]): void {}

	// Utils
	private updateActiveFile(): void {
		console.log('CalendarView > on(periodic-notes:settings-updated) > updateActiveFile()')
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

	// public revealActiveNote(): void {
	// 	const { moment } = window;
	// 	const { activeLeaf } = this.app.workspace;

	// 	if (activeLeaf.view instanceof FileView) {
	// 		// Check to see if the active note is a daily-note
	// 		let date = getDateFromFile(activeLeaf.view.file, 'day');
	// 		if (date) {
	// 			this.calendar.$set({ displayedMonth: date });
	// 			return;
	// 		}

	// 		// Check to see if the active note is a weekly-note
	// 		const { format } = getWeeklyNoteSettings();
	// 		date = moment(activeLeaf.view.file.basename, format, true);
	// 		if (date.isValid()) {
	// 			this.calendar.$set({ displayedMonth: date });
	// 			return;
	// 		}
	// 	}
	// }
}
