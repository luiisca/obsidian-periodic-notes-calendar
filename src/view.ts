import {
    FileView,
    ItemView,
    Notice,
    TAbstractFile,
    TFile,
    WorkspaceLeaf
} from 'obsidian';

import { InvalidFormat } from '@/ui';
import { mount, unmount } from "svelte";
import { get } from 'svelte/store';
import View from './View.svelte';
import { VIEW_TYPE } from './constants';
import { basename, storeAllVaultPeriodicFilepaths } from './io';
import { isValidPeriodicNote } from './io/validation';
import type PeriodicNotesCalendarPlugin from './main';
import { settingsStore } from './settings';
import { activeFilepathStore, themeStore } from './stores';
import { internalFileModStore } from './stores/notes';

export class CalendarView extends ItemView {
    private view: Record<string, any>;
    // private triggerLinkHover: () => void;
    plugin: PeriodicNotesCalendarPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: PeriodicNotesCalendarPlugin) {
        super(leaf);
        this.plugin = plugin;

        this.registerEvent(
            this.app.workspace.on('css-change', () => {
                const crrTheme = this.plugin.getTheme();

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
        this.registerEvent(this.app.workspace.on('file-open', () => this.onFileOpen()));
        this.registerEvent(
            this.app.metadataCache.on('changed', (file: TFile) => this.onMetadataChanged(file))
        )
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText() {
        return 'Example view';
    }

    async onOpen() {
        console.log('On open view👐');

        this.view = mount(View, {
            target: this.contentEl
        });

        // index existing notes
        if (this.app.workspace.layoutReady && this.view) {
            storeAllVaultPeriodicFilepaths(true)
        }
    }

    onClose(): Promise<void> {
        console.log('On close view❌');
        unmount(this.view);

        return Promise.resolve();
    }

    private onMetadataChanged(file: TFile) {
        // little hack to trigger a rerender every time metadata changes
        internalFileModStore.set({ modified: Math.random() })
    }

    private onFileCreated(file: TFile) {
        if (get(internalFileModStore) === 'created') return;

        console.log('✅ ON file created ✅', file);

        if (this.app.workspace.layoutReady && this.view) {
            if (file.extension !== 'md') return;

            const { isValid, granularity, format } = isValidPeriodicNote(file.basename);

            if (isValid === false) {
                const fragment = document.createDocumentFragment();
                mount(InvalidFormat, {
                    // @ts-ignore
                    target: fragment,
                    props: {
                        granularity,
                        filepath: file.path,
                        formatValue: format.value,
                        error: format.error
                    }
                })
                new Notice(fragment, 10000)
            }
            if (typeof isValid === "boolean") {
                settingsStore.addFilepath(file.path, format.value)
            }
        }
    }

    private async onFileDeleted(file: TFile): Promise<void> {
        if (get(internalFileModStore) === 'deleted') return;

        console.log('❌ ON file deleted ❌', file);

        if (this.app.workspace.layoutReady && this.view) {
            if (file.extension !== 'md') return;

            const { granularity, format } = isValidPeriodicNote(file.basename);

            if (granularity && format) {
                settingsStore.deleteFilepath(file.path, format.value)
            }
        }
    }

    private async onFileRenamed(renamedFile: TFile, oldPath: string): Promise<void> {
        if (get(internalFileModStore) === 'renamed') return;

        const _oldData = isValidPeriodicNote(basename(oldPath));
        const _newData = isValidPeriodicNote(renamedFile.basename);

        if (_newData.isValid === false) {
            const fragment = document.createDocumentFragment();
            mount(InvalidFormat, {
                // @ts-ignore
                target: fragment,
                props: {
                    granularity: _newData.granularity,
                    filepath: renamedFile.path,
                    formatValue: _newData.format.value,
                    error: _newData.format.error
                }
            })
            new Notice(fragment, 10000)
        }
        settingsStore.renameFilepath({
            oldData: {
                path: oldPath,
                formatValue: _oldData.format?.value,
                toBeDeleted: typeof _oldData.isValid === "boolean"
            },
            newData: {
                path: renamedFile.path,
                formatValue: _newData.format?.value,
                toBeAdded: typeof _newData.isValid === 'boolean' && renamedFile.extension === 'md'
            }
        })
    }

    public onFileOpen() {
        if (this.app.workspace.layoutReady) {
            console.log('view.ts > onFileOpen()');
            this.updateActiveFile();
        }
    }

    // Utils
    private updateActiveFile(): void {
        // const activeLeafOG = this.app.workspace.activeLeaf;

        // TODO: may cause unexpected behavior.
        const activeLeaf = this.app.workspace.getActiveViewOfType(CalendarView)

        if (activeLeaf?.view && activeLeaf.view instanceof FileView) {
            const file = activeLeaf.view.file;
            if (!file) return;

            const { isValid, granularity, date } = isValidPeriodicNote(file.basename);
            if (typeof isValid === 'boolean' && date && granularity) {
                activeFilepathStore.set(file.path);
            }
        }

        console.log('🪟📅 view.ts > updateActiveFile(), activeFilepathStore: ', get(activeFilepathStore));
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
