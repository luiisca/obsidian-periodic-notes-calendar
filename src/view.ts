import {
    FileView,
    ItemView,
    TAbstractFile,
    TFile,
    WorkspaceLeaf
} from 'obsidian';

import { get } from 'svelte/store';
import View from './View.svelte';
import { VIEW_TYPE } from './constants';
import { basename, IGranularity, storeAllVaultPeriodicFilepaths } from './io';
import { isValidPeriodicNote } from './io/validation';
import type PeriodicNotesCalendarPlugin from './main';
import { PeriodSettings, settingsStore } from './settings';
import { activeFilepathStore, themeStore } from './stores';
import { internalRenamingStore, justModFileDataStore } from './stores/notes';

export class CalendarView extends ItemView {
    private view: View;
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
            storeAllVaultPeriodicFilepaths(true)
        }
    }

    onClose(): Promise<void> {
        console.log('On close view❌');
        this.view?.$destroy();

        return Promise.resolve();
    }

    private onFileCreated(file: TFile) {
        console.log('✅ ON file created ✅', file);

        if (this.app.workspace.layoutReady && this.view) {
            this.handlePeriodicFileChange(file, 'created')
        }
    }

    private async onFileDeleted(file: TFile): Promise<void> {
        console.log('❌ ON file deleted ❌', file);

        if (this.app.workspace.layoutReady && this.view) {
            this.handlePeriodicFileChange(file, 'deleted')
        }
    }

    private async onFileRenamed(renamedFile: TFile, oldPath: string): Promise<void> {
        if (get(internalRenamingStore)) return;

        const oldData = isValidPeriodicNote(basename(oldPath));
        const newData = isValidPeriodicNote(renamedFile.basename);

        settingsStore.update(s => {
            const addNew = () => {
                if (newData.granularity) {
                    s.filepaths[renamedFile.path] = newData.format.value;

                    if (!(newData.format.value in s.filepathsByFormatValue)) {
                        s.filepathsByFormatValue[newData.format.value] = {}
                    }

                    s.filepathsByFormatValue[newData.format.value]![renamedFile.path] = renamedFile.path;
                }
            }
            const removeOld = () => {
                if (oldData.granularity) {
                    delete s.filepaths[oldPath];
                    delete s.filepathsByFormatValue[oldData.format.value]?.[oldPath]
                }
            }

            removeOld();
            if (typeof newData.isValid === 'boolean' && renamedFile.extension === 'md') {
                addNew();
            }

            return s
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

    private handlePeriodicFileChange(file: TFile, op: "created" | "modified" | "deleted") {
        if (file.extension !== 'md') return;

        let granularity: IGranularity | null = null;
        let format: PeriodSettings['formats'][0] | null = null;

        const justModFileData = get(justModFileDataStore);
        if (justModFileData?.op === op) {
            granularity = justModFileData?.granularity;
            format = justModFileData?.format;

            justModFileDataStore.set(null);
        }

        if (!justModFileData) {
            const { isValid, granularity: _granularity, format: _format } = isValidPeriodicNote(file.basename);

            if (typeof isValid === "boolean") {
                granularity = _granularity
                format = _format
            }
        }

        // adds file's format to corresponding format.filePaths in settingsStore
        if (granularity && format) {
            settingsStore.update(s => {
                if (op === 'created') {
                    s.filepaths[file.path] = format.value;

                    if (!(format.value in s.filepathsByFormatValue)) {
                        s.filepathsByFormatValue[format.value] = {}
                    }

                    s.filepathsByFormatValue[format.value]![file.path] = file.path;

                    return s
                }

                if (op === 'deleted') {
                    delete s.filepaths[file.path];
                    delete s.filepathsByFormatValue[format.value]?.[file.path]

                    return s
                }

                return s
            })
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
