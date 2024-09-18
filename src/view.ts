import {
    FileView,
    ItemView,
    TAbstractFile,
    TFile,
    WorkspaceLeaf,
    type CachedMetadata,
    type TagCache,
    debounce
} from 'obsidian';

import View from './View.svelte';
import { activeFileIdStore, notesStores, themeStore } from './stores';
import { getDateFromFile, getDateUID } from './io';
import type { Moment } from 'moment';
import type { IGranularity } from './io';
import { PERIODIC_NOTES_PLUGIN_ID, VIEW_TYPE, granularities } from './constants';
import { getDateFromPath } from './io/parse';
import { get } from 'svelte/store';
import { isControlPressed } from './ui/utils';
import { getNewValidFormatsFromSettings } from './io/validation';
import type PeriodicNotesCalendarPlugin from './main';
import { getPlugin } from './utils';

export class CalendarView extends ItemView {
    private view: View;
    private triggerLinkHover: () => void;
    plugin: PeriodicNotesCalendarPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: PeriodicNotesCalendarPlugin) {
        super(leaf);
        this.plugin = plugin;

        this.registerEvent(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (<any>this.app.workspace).on(
                'periodic-notes:settings-updated',
                debounce(this.onPeriodicNotesSettingsUpdate.bind(this), 1000)
            )
        );

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
            granularities.forEach((granularity) => {
                notesStores[granularity].index();
            });
        }
    }

    onClose(): Promise<void> {
        console.log('On close view❌');
        if (this.view) {
            this.view.$destroy();
        }

        return Promise.resolve();
    }

    // triggered when periodic-notes settings are updated
    private async onPeriodicNotesSettingsUpdate(): Promise<void> {
        const periodicNotesPlugin = await getPlugin(PERIODIC_NOTES_PLUGIN_ID);
        console.log("new settings", periodicNotesPlugin.settings)
        this.plugin.saveSettings((oldSettings) => {
            console.log("😋 saving settings", oldSettings)
            return {
                validFormats: getNewValidFormatsFromSettings(oldSettings.validFormats)
            }
        });
        this.updateActiveFile.bind(this)();
    }

    private onFileCreated(file: TFile) {
        if (this.app.workspace.layoutReady && this.view) {
            let date: Moment | null = null;
            const granularity = granularities.find(
                (granularity) => (date = getDateFromFile(file, granularity, true))
            );

            console.log('On file created > date: ', date);
            console.log('On file created > granularity: ', granularity);

            if (date && granularity) {
                const dateUID = getDateUID({ date, granularity });

                console.log('On file created > dateUID: ', dateUID);

                const fileExists = get(notesStores[granularity])[dateUID];

                console.log('On file created > fileExists: ', fileExists);

                // update matching file in store
                !fileExists &&
                    notesStores[granularity].update((values) => ({
                        ...values,
                        [dateUID]: {
                            file,
                            sticker: null
                        }
                    }));
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
            const dateUID = getDateUID({ date, granularity });
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

    private async onFileRenamed(renamedFile: TFile, oldPath: string): Promise<void> {
        let newDate = null as Moment | null;
        const newGranularity = granularities.find(
            (granularity) => (newDate = getDateFromFile(renamedFile, granularity))
        );
        let oldDate = null as Moment | null;
        const oldGranularity = granularities.find(
            (granularity) => (oldDate = getDateFromPath(oldPath, granularity))
        );
        const oldIsValid = Boolean(oldDate && oldGranularity);
        const newIsValid = Boolean(newDate && newGranularity);

        // OLD filename INVALID ❌ && NEW filename VALID ✅ => update store to add NEW file with null emoji
        if (!oldIsValid && newIsValid && newGranularity) {
            const notesStore = notesStores[newGranularity];
            const dateUID = getDateUID({
                date: newDate as unknown as Moment,
                granularity: newGranularity
            });
            notesStore.update((values) => ({
                ...values,
                [dateUID]: {
                    file: renamedFile,
                    sticker: null
                }
            }));
        }

        // OLD filename VALID ✅ && NEW filename INVALID ❌ => update store to remove OLD
        if (oldIsValid && !newIsValid && oldGranularity && newGranularity) {
            const notesStore = notesStores[oldGranularity];
            const dateUID = getDateUID({
                date: oldDate as unknown as Moment,
                granularity: newGranularity
            });

            const newStore = {
                ...get(notesStore)
            };
            delete newStore[dateUID];

            notesStore.set(newStore);
        }

        // OLD filename CALID ✅ && NEW filename INVALID ✅ => update store to remove OLD and add NEW one with OLD emoji
        if (oldIsValid && newIsValid && newGranularity && oldGranularity) {
            const newNotesStore = notesStores[newGranularity];
            const newDateUID = getDateUID({
                date: newDate as unknown as Moment,
                granularity: newGranularity
            });

            const oldNotesStore = notesStores[oldGranularity];
            const oldDateUID = getDateUID({
                date: oldDate as unknown as Moment,
                granularity: newGranularity
            });
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
                    file: renamedFile,
                    sticker: oldEmoji
                }
            }));
        }

        console.log('‍✏️On file renamed ✏️ > file: ', renamedFile, oldPath);
        console.log('new store: ', newGranularity && get(notesStores[newGranularity]));
    }
    private async onFileModified(file: TFile, data: string, cache: CachedMetadata): Promise<void> {
        let date: Moment | null = null;
        const granularity = granularities.find(
            (granularity) => (date = getDateFromFile(file, granularity))
        );
        const noteStore = granularity ? notesStores[granularity] : null;
        const noteDateUID = date && granularity ? getDateUID({ date, granularity }) : null;

        const oldEmoji = noteStore && noteDateUID && get(noteStore)[noteDateUID].sticker;
        const newEmoji =
            cache.tags?.find((tagObj: TagCache) => /\p{RGI_Emoji}/v.test(tagObj.tag))?.tag.slice(1) || null;

        if (oldEmoji !== newEmoji && noteStore && noteDateUID) {
            noteStore.update((values) => ({
                ...values,
                [noteDateUID]: {
                    file,
                    sticker: newEmoji
                }
            }));
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

    // 	const { format } = getNoteSettingsByPeriodicity(granularity);
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
    private updateActiveFile(): void {
        console.log('🪟📅 view.ts > updateActiveFile()');
        // get activeLeaf view
        const activeLeafOG = this.app.workspace.activeLeaf;
        // TODO: may cause unexpected behavior, check on it.
        const activeLeaf = this.app.workspace.getActiveViewOfType(CalendarView)

        let file: TFile | null = null;
        if (activeLeaf?.view && activeLeaf?.view instanceof FileView) {
            // extract file from view
            file = activeLeaf.view.file;

            if (file) {
                let noteDate: Moment | null = null;
                let noteGranularity: IGranularity | null = null;

                for (const granularity of granularities) {
                    const date = getDateFromFile(file as TFile, granularity);
                    console.log('✅✅✅date and granularity found ✅✅✅');
                    console.log('date', date, 'granularity', granularity);

                    if (date) {
                        noteDate = date;
                        noteGranularity = granularity;

                        break;
                    }
                }

                // save file in activeFile store
                if (noteDate && noteGranularity) {
                    activeFileIdStore.setFile(getDateUID({ date: noteDate, granularity: noteGranularity }));
                }
            }
        }
    }

    private keydownCallback(ev: KeyboardEvent) {
        console.log('view.ts > keydownCallback > isControlPressed() > this: ', this, isControlPressed(ev));
        if (isControlPressed(ev)) {
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
