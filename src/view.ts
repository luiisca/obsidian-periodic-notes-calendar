import {
	FileView,
	ItemView,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
	type CachedMetadata,
	type TagCache,
} from 'obsidian';

import View from './View.svelte';
import { activeFile, notesStores, settingsStore} from './stores';
import type { ISettings } from './settings';
import {
	getDateFromFile,
	getDateUID,
	getNoteByGranularity,
} from './calendar-io';
import type { Moment } from 'moment';
import type { IGranularity } from './calendar-io';
import { granularities } from './constants';
import { getNoteSettingsByGranularity } from './calendar-io/settings';
import { getDateFromPath} from './calendar-io/parse';
import { get} from 'svelte/store';
import { isMetaPressed } from './calendar-ui/utils';

export const VIEW_TYPE_CALENDAR = 'calendar';


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
			this.app.vault.on('rename', (file: TAbstractFile, oldPath: string) =>
				this.onFileRenamed(file as TFile, oldPath)
			)
		);
		// this.registerEvent(
		// 	this.app.vault.on('modify', (file: TAbstractFile) => this.onFileModified(file as TFile))
		// );
		this.registerEvent(this.app.metadataCache.on('changed', this.onFileModified));
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

		// TODO: move this eventHandlers to store

		this.view = new View({
			target: this.contentEl,
		});

		// index existing notes
		if (this.app.workspace.layoutReady && this.view) {
			console.log("🔥🔥🔥 view.ts > onOpen() > indexing notes 🔥🔥🔥")
			granularities.forEach((granularity) => {
				notesStores[granularity].index();
			});
		}
	}

	// app.workspace and app.vault event handlers
	private onNoteSettingsUpdate(): void {
		// 1. update array of valid formats if there are new ones for any granularity
		// validFormats = {
		// 	day: ['format1', 'format2', 'format3'],
		// 	week: ['format1'],
		// 	month: ['format1'],
		// }
		granularities.forEach((granularity) => {
			// notesStores[granularity].reindex();
		});
		this.updateActiveFile();
	}

	private onFileCreated(file: TFile) {
		console.log('✅ onFileCreated > file: ✅', file);

		if (this.app.workspace.layoutReady && this.view) {
			let date: Moment | null = null;
			const granularity = granularities.find(
				(granularity) => (date = getDateFromFile(file, granularity))
			);

			if (date && granularity) {
				const dateUID = getDateUID(date, granularity);
				const fileExists = get(notesStores[granularity])[dateUID];

				// update matching file in store
				!fileExists &&
					notesStores[granularity].update((values) => ({
						...values,
						[dateUID]: {
							file,
							sticker: null
						}
					}));

				console.log(`${dateUID} succesfully created`, 'new store: ', get(notesStores[granularity]));
			}
		}
	}

	private async onFileDeleted(file: TFile): Promise<void> {
		console.log('❌ ON file deleted ❌');

		let date: Moment | null = null;
		const granularity = granularities.find(
			(granularity) => (date = getDateFromFile(file, granularity))
		);

		if (date && granularity) {
			const notesStore = notesStores[granularity];
			const dateUID = getDateUID(date, granularity);
			const fileExists = get(notesStore)[dateUID];
			const newStore = {
				...get(notesStore)
			};

			if (fileExists) {
				delete newStore[dateUID];
				notesStore.update(() => newStore);
				console.log(`${dateUID} succesfully deleted`, 'new store: ', get(notesStores[granularity]));
			}
		}

		this.updateActiveFile();
	}

	private async onFileRenamed(file: TFile, oldPath: string): Promise<void> {
		let newDate: Moment | null = null;
		const newGranularity = granularities.find(
			(granularity) => (newDate = getDateFromFile(file, granularity))
		);
		let oldDate: Moment | null = null;
		const oldGranularity = granularities.find(
			(granularity) => (oldDate = getDateFromPath(oldPath, granularity))
		);
		const oldIsValid = oldDate && oldGranularity;
		const newIsValid = newDate && newGranularity;

		// OLD filename INVALID ❌ && NEW filename VALID ✅ => update store to add NEW file with null emoji
		if (!oldIsValid && newIsValid) {
			const notesStore = notesStores[newGranularity];
			const dateUID = getDateUID(newDate as unknown as Moment, newGranularity);
			notesStore.update((values) => ({
				...values,
				[dateUID]: {
					file,
					sticker: null
				}
			}));
		}

		// OLD filename VALID ✅ && NEW filename INVALID ❌ => update store to remove OLD
		if (oldIsValid && !newIsValid) {
			const notesStore = notesStores[oldGranularity];
			const dateUID = getDateUID(oldDate as unknown as Moment, newGranularity);

			const newStore = {
				...get(notesStore)
			};
			delete newStore[dateUID];

			notesStore.set(newStore);
		}

		// OLD filename CALID ✅ && NEW filename INVALID ✅ => update store to remove OLD and add NEW one with OLD emoji
		if (oldIsValid && newIsValid) {
			const newNotesStore = notesStores[newGranularity];
			const newDateUID = getDateUID(newDate as unknown as Moment, newGranularity);

			const oldNotesStore = notesStores[oldGranularity];
			const oldDateUID = getDateUID(oldDate as unknown as Moment, newGranularity);
			const oldEmoji = get(oldNotesStore)[oldDateUID].sticker;

			// remove OLD file
			const newStore = {
				...get(oldNotesStore)
			};
			delete newStore[oldDateUID];

			// add NEW file to store with OLD emoji
			newNotesStore.update((values) => ({
				...values,
				[newDateUID]: {
					file,
					sticker: oldEmoji
				}
			}));
		}

		console.log('‍✏️On file renamed ✏️ > file: ', file, oldPath);
		console.log('new store: ', newGranularity && get(notesStores[newGranularity]));
		this.view.rerenderCalendar();
	}
	private async onFileModified(file: TFile, data: string, cache: CachedMetadata): Promise<void> {
		console.log('‍✏️On file modified ✏️ > file: ', file, cache);

		let date: Moment | null = null;
		const granularity = granularities.find(
			(granularity) => (date = getDateFromFile(file, granularity))
		);
		const dateUID = date && granularity ? getDateUID(date, granularity) : null;
		const notesStore = (granularity && notesStores[granularity]) || null;

		const oldEmoji = notesStore && dateUID && get(notesStore)[dateUID].sticker;
		const newEmoji =
			cache.tags
				?.find((el: TagCache) => el.tag.contains('sticker-'))
				?.tag.match(/#sticker-([^\s]+)/)?.[1] || null;

		if (oldEmoji !== newEmoji && notesStore && granularity && dateUID) {
			console.log('updating EMOJI 🏳️‍🌈');
			notesStores[granularity].update((values) => ({
				...values,
				[dateUID]: {
					file,
					sticker: newEmoji
				}
			}));
		}
	}

	public onFileOpen() {
		if (this.app.workspace.layoutReady) {
			this.updateActiveFile();
		}
	}

	// onHover({ date, targetEl, isMetaPressed, granularity }: Parameters<TOnHover>[0]): void {
	// 	// console.log('view.ts > onHover(): 📈')
	// 	// this.keydownFn && window.removeEventListener('keydown', this.keydownFn);

	// 	const { format } = getNoteSettingsByGranularity(granularity);
	// 	const note = getNoteByGranularity({ date, granularity });

	// 	this.triggerLinkHover = () =>
	// 		this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);

	// 	if (!isMetaPressed && !this.settings.autoHoverPreview) {
	// 		// TODO: add markdown view popover when ctrlKey pressed after hover
	// 		// window.addEventListener('keydown', this.keydownFn);

	// 		return;
	// 	}

	// 	this.triggerLinkHover();
	// }

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

				// save file in activeFile store
				if (noteDate && noteGranularity) {
					activeFile.setFile(getDateUID(noteDate, noteGranularity));

					console.log('update active file, running rerenderCalendar()');
					this.view && this.view.rerenderCalendar();
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
