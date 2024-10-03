import {
    FileView,
    ItemView,
    TAbstractFile,
    TFile,
    WorkspaceLeaf,
    type CachedMetadata,
    type TagCache
} from 'obsidian';

import type { Moment } from 'moment';
import { get } from 'svelte/store';
import View from './View.svelte';
import { VIEW_TYPE } from './constants';
import { basename, getNoteDateUID, storeAllVaultPeriodicNotes } from './io';
import { isValidPeriodicNote } from './io/validation';
import type PeriodicNotesCalendarPlugin from './main';
import { activeFileIdStore, notesStores, themeStore } from './stores';
import { isControlPressed } from './ui/utils';

export class CalendarView extends ItemView {
    private view: View;
    private triggerLinkHover: () => void;
    plugin: PeriodicNotesCalendarPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: PeriodicNotesCalendarPlugin) {
        super(leaf);
        this.plugin = plugin;

        this.registerEvent(
            this.app.workspace.on('css-change', () => {
                const crrTheme = this.plugin.getTheme();
                console.log(this);

                themeStore.set((crrTheme === 'moonstone' || crrTheme === "light") ? 'light' : 'dark')
            })
        )
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
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText() {
        return 'Example view';
    }

    async onOpen() {
        console.log('On open view👐');

        this.view = new View({
            target: this.contentEl
        });

        // index existing notes
        if (this.app.workspace.layoutReady && this.view) {
            storeAllVaultPeriodicNotes()
        }
    }

    onClose(): Promise<void> {
        console.log('On close view❌');
        this.view?.$destroy();

        return Promise.resolve();
    }

    private onFileCreated(file: TFile) {
        console.log('✅ ON file creted ✅', file);

        if (this.app.workspace.layoutReady && this.view) {
            const { isValid, granularity, date } = isValidPeriodicNote(file.basename);

            if (isValid) {
                const noteDateUID = getNoteDateUID({ date, granularity });
                const fileExists = get(notesStores[granularity])[noteDateUID];

                if (fileExists) return;

                notesStores[granularity].update((values) => ({
                    ...values,
                    [noteDateUID]: {
                        file,
                        sticker: null
                    }
                }));
                console.log(`${noteDateUID} succesfully created`, 'new store: ', get(notesStores[granularity]));
            }
        }
    }

    private async onFileDeleted(file: TFile): Promise<void> {
        console.log('❌ ON file deleted ❌');

        const { isValid, granularity, date } = isValidPeriodicNote(file.basename);

        if (isValid) {
            const noteDateUID = getNoteDateUID({ date, granularity });
            const fileExists = get(notesStores[granularity])[noteDateUID];
            const newStore = {
                ...get(notesStores[granularity])
            };

            if (fileExists) {
                delete newStore[noteDateUID];
                notesStores[granularity].update(() => newStore);
                console.log(`${noteDateUID} succesfully deleted`, 'new store: ', get(notesStores[granularity]));
            };
        }

        this.updateActiveFile();
    }

    private async onFileRenamed(renamedFile: TFile, oldPath: string): Promise<void> {
        const { isValid: oldIsValid, granularity: oldGranularity, date: oldDate } = isValidPeriodicNote(basename(oldPath));
        const { isValid: newIsValid, granularity: newGranularity, date: newDate } = isValidPeriodicNote(renamedFile.basename);

        // OLD filename INVALID ❌ && NEW filename VALID ✅ => update store to add NEW file with null emoji
        if (!oldIsValid && newIsValid) {
            const newNotesStore = notesStores[newGranularity];
            const newNoteDateUID = getNoteDateUID({
                date: newDate as unknown as Moment,
                granularity: newGranularity
            });
            newNotesStore.update((values) => ({
                ...values,
                [newNoteDateUID]: {
                    file: renamedFile,
                    sticker: null
                }
            }));
        }

        // OLD filename VALID ✅ && NEW filename INVALID ❌ => update store to remove OLD
        if (oldIsValid && !newIsValid) {
            const oldNotesStore = notesStores[oldGranularity];
            const oldNoteDateUID = getNoteDateUID({
                date: oldDate as unknown as Moment,
                granularity: oldGranularity
            });

            const modOldStore = {
                ...get(oldNotesStore)
            };
            delete modOldStore[oldNoteDateUID];

            oldNotesStore.set(modOldStore);
        }

        // OLD filename CALID ✅ && NEW filename INVALID ✅ => update store to remove OLD and add NEW one with OLD emoji
        if (oldIsValid && newIsValid) {
            const newNotesStore = notesStores[newGranularity];
            const newNoteDateUID = getNoteDateUID({
                date: newDate as unknown as Moment,
                granularity: newGranularity
            });

            const oldNotesStore = notesStores[oldGranularity];
            const oldNoteDateUID = getNoteDateUID({
                date: oldDate as unknown as Moment,
                granularity: newGranularity
            });
            const oldEmoji = get(oldNotesStore)[oldNoteDateUID].sticker;

            // remove OLD file
            const modOldStore = {
                ...get(oldNotesStore)
            };
            delete modOldStore[oldNoteDateUID];

            // add NEW file to store with OLD emoji
            newNotesStore.update((values) => ({
                ...values,
                [newNoteDateUID]: {
                    file: renamedFile,
                    sticker: oldEmoji
                }
            }));
        }

        console.log('✏️On file renamed ✏️ > file: ', renamedFile, oldPath);
        console.log('new store: ', newGranularity && get(notesStores[newGranularity]));
    }

    private async onFileModified(file: TFile, data: string, cache: CachedMetadata): Promise<void> {
        const { isValid, granularity, date } = isValidPeriodicNote(file.basename);

        if (isValid && date && granularity) {
            const noteDateUID = getNoteDateUID({ date, granularity });
            const oldEmoji = get(notesStores[granularity])[noteDateUID].sticker;
            const newEmoji =
                cache.tags?.find((tagObj: TagCache) => /\p{RGI_Emoji}/v.test(tagObj.tag))?.tag.slice(1) || null;

            if (oldEmoji !== newEmoji) {
                notesStores[granularity].update((values) => ({
                    ...values,
                    [noteDateUID]: {
                        file,
                        sticker: newEmoji
                    }
                }));
            }
        }
    }

    public onFileOpen() {
        if (this.app.workspace.layoutReady) {
            console.log('view.ts > onFileOpen()');
            this.updateActiveFile();
        }
    }

    // onHover({ date, targetEl, isControlPressed, granularity }: Parameters<TOnHover>[0]): void {
    // 	// console.log('view.ts > onHover(): 📈')
    // 	// this.keydownFn && window.removeEventListener('keydown', this.keydownFn);

    // 	const { format } = getNoteSettings(granularity);
    // 	const note = getNoteByGranularity({ date, granularity });

    // 	this.triggerLinkHover = () =>
    // 		this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);

    // 	if (!isControlPressed && !this.settings.autoHoverPreview) {
    // 		// TODO: add markdown view popover when ctrlKey pressed after hover
    // 		// window.addEventListener('keydown', this.keydownFn);

    // 		return;
    // 	}

    // 	this.triggerLinkHover();
    // }

    // Utils

    /**
        * Set noteDateUID from current view's file in activeFileIdStore.
        */
    private updateActiveFile(): void {
        // const activeLeafOG = this.app.workspace.activeLeaf;

        // TODO: may cause unexpected behavior.
        const activeLeaf = this.app.workspace.getActiveViewOfType(CalendarView)

        if (activeLeaf?.view && activeLeaf.view instanceof FileView) {
            const file = activeLeaf.view.file;
            if (!file) return;

            const { isValid, granularity, date } = isValidPeriodicNote(file.basename);
            if (isValid && date && granularity) {
                const noteDateUID = getNoteDateUID({ date, granularity })
                activeFileIdStore.set(noteDateUID);
            }
        }

        console.log('🪟📅 view.ts > updateActiveFile(), activeFileIdStore: ', get(activeFileIdStore));
    }

    private keydownCallback(ev: KeyboardEvent) {
        console.log('view.ts > keydownCallback > isControlPressed() > this: ', this, isControlPressed(ev));
        if (isControlPressed(ev)) {
            this.triggerLinkHover?.();
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
