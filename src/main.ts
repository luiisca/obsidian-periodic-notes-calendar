import { DEFAULT_SETTINGS, settingsStore, SettingsTab, type ISettings } from '@/settings';
import { InvalidFormat, View, ViewManager } from '@/ui';
import moment from 'moment';
import { MarkdownView, Menu, Notice, Plugin, TAbstractFile, TFile, WorkspaceLeaf, WorkspaceRoot } from 'obsidian';
import { mount, type SvelteComponent } from 'svelte';
import { get } from 'svelte/store';
import { CALENDAR_POPOVER_ID, CALENDAR_RIBBON_ID, FILE_MENU_POPOVER_ID, granularities, LEAF_TYPE, STICKER_POPOVER_ID } from './constants';
import { basename, createOrOpenNote, extractAndReplaceTODOItems, getFileData, getStartupNoteGranularity, storeAllVaultPeriodicFilepaths } from './io';
import { getPeriodicityFromGranularity } from './io/parse';
import type { IGranularity, IPeriodicity } from './io/types';
import { isValidPeriodicNote } from './io/validation';
import {
    activeFileStore,
    displayedDateStore,
    internalFileModStore,
    mainLeafStore,
    pluginClassStore,
    previewLeafStore,
    processingPreviewChangeStore,
    setupLocale,
    spFileDataStore,
    themeStore,
    timelineParentFileStore
} from './stores';
import StickerPopoverComponent from './ui/components/StickerPopover.svelte';
import TimelineManager from './ui/components/timeline/manager';
import { addExtraItems } from './ui/components/view/utils';
import { createNldatePickerDialog } from './ui/modals/nldate-picker';
import { getBehaviorInstance, getPopoverInstance, Popover } from './ui/popovers';
import { getDailyNotesPlugin, handleLocaleCommands, isPhone } from './utils';
import { CalendarView } from './view';

export default class PeriodicNotesCalendarPlugin extends Plugin {
    popovers: Record<string, SvelteComponent | null> = {};
    popoversCleanups: (() => void)[] = [];
    popoverAutoUpdateCleanup: (() => void) | null = null;

    onunload() {
        ViewManager.unload();
        TimelineManager.unload();
        this.popoversCleanups.forEach((cleanup) => cleanup());
    }

    async onload() {
        window.plugin = this;

        await this.loadSettings();
        this.registerEvents()

        pluginClassStore.set(this);

        // theme
        const crrTheme = this.getTheme();
        themeStore.set((crrTheme === 'moonstone' || crrTheme === "light") ? 'light' : 'dark');

        // plugins
        await getDailyNotesPlugin()

        // sub settings
        const unsubSettingsStore = settingsStore.subscribe(this.saveSettings.bind(this))
        this.register(unsubSettingsStore);

        this.addSettingTab(new SettingsTab(this.app, this));

        setupLocale()
        this.handleRibbon();

        // register view and preview
        // register a view under a specific leaf type so obsidian knows to render it when calling `setViewState` with LEAF_TYPE
        this.registerView(LEAF_TYPE, (leaf) => new CalendarView(leaf, this));

        // Commands
        this.addCommand({
            id: 'toggle-calendar-view',
            name: 'Toggle calendar Interface',
            callback: () => {
                this.toggleView();
            }
        });

        granularities.forEach((granularity) => {
            (['previous', 'next'] as const).forEach((pos) => {
                const periodicity = getPeriodicityFromGranularity(granularity) as Exclude<
                    IPeriodicity,
                    'daily'
                >;

                let posText:
                    | `${typeof pos}-${Exclude<typeof periodicity, 'daily'>}`
                    | 'tomorrow'
                    | 'yesterday';

                if (granularity === 'day') {
                    posText = pos === 'next' ? 'tomorrow' : 'yesterday';
                } else {
                    posText = `${pos}-${periodicity}`;
                }

                this.addCommand({
                    id: `create-${posText}-note`,
                    name: `Open ${granularity === 'day'
                        ? `${posText}'s`
                        : `${pos} ${getPeriodicityFromGranularity(granularity)}`
                        } note`,
                    callback: () => {
                        const { workspace } = window.app;
                        const leaf = workspace.getLeaf(false);
                        const newDate = window
                            .moment()
                            .clone()
                        [pos === 'next' ? 'add' : 'subtract'](1, granularity)
                            .startOf(granularity);

                        createOrOpenNote({ leaf, date: newDate, granularity, confirmBeforeCreateOverride: false });
                    }
                });
            });
        });

        this.addCommand({
            id: 'open-nldate-note',
            name: 'Open Periodic Note from Natural Language Date',
            callback: createNldatePickerDialog,
        });

        // add quick locales switch commands
        handleLocaleCommands()

        this.app.workspace.onLayoutReady(() => {
            // index existing notes
            storeAllVaultPeriodicFilepaths(true)

            ViewManager.initView({ active: false });
            ViewManager.handleLayoutChange();
            TimelineManager.initAll();

            if (get(settingsStore).openPopoverOnRibbonHover) {
                Popover.create({
                    id: CALENDAR_POPOVER_ID,
                    view: {
                        Component: View,
                        props: {
                            popover: true
                        }
                    }
                });
            }

            // open note at startup
            const startupNoteGranularity = getStartupNoteGranularity();
            if (startupNoteGranularity) {
                createOrOpenNote({
                    leaf: this.app.workspace.getLeaf(),
                    date: window.moment(),
                    granularity: startupNoteGranularity,
                    confirmBeforeCreateOverride: false,
                    openInPreview: get(settingsStore).preview.enabled && get(settingsStore).preview.openNotesInPreview
                });
            }
        });
    }

    async loadSettings() {
        const loadedSettings = (await this.loadData()) as ISettings;
        !loadedSettings && (await this.saveData(DEFAULT_SETTINGS));

        settingsStore.update((old) => {
            const newSettings = { ...old, ...(loadedSettings || {}) };
            const periods = newSettings.periods
            Object.entries(periods).forEach(([granularity, periodSettings]) => {
                Object.values(periodSettings.formats).forEach((format) => {
                    periods[granularity as IGranularity].formats[format.id].loading = false
                })
            })
            return {
                ...newSettings,
                preview: {
                    ...newSettings.preview,
                    defaultExpansionMode: isPhone() ? "maximized" : newSettings.preview.defaultExpansionMode
                },
                // reset formats loading state
                periods
            }
        });
    }

    async saveSettings(newSettings: ISettings) {
        await this.saveData(newSettings);
    }

    handleRibbon() {
        const ribbonEl = this.addRibbonIcon('calendar-days', 'Open calendar', (ev) => {
            const calendarPopover = getPopoverInstance(CALENDAR_POPOVER_ID);
            const calendarBehavior = getBehaviorInstance(CALENDAR_POPOVER_ID);

            if (!get(settingsStore).floatingMode) {
                this.toggleView();

                if (get(settingsStore).openPopoverOnRibbonHover && calendarBehavior?.opened) {
                    calendarBehavior.close();
                }

                return;
            } else {
                const calendarEl = document.querySelector(`#${CALENDAR_POPOVER_ID}[data-popover="true"]`) as HTMLElement | undefined;
                const target = ev.target as Element

                if (
                    !calendarEl &&
                    !calendarPopover &&
                    target
                ) {
                    Popover.create({
                        id: CALENDAR_POPOVER_ID,
                        view: {
                            Component: View,
                            props: {
                                popover: true,
                            }
                        }
                    }).open(target);
                } else {
                    calendarPopover?.toggle(target)
                }
            }
        });

        ribbonEl.id = CALENDAR_RIBBON_ID
    }

    async toggleView() {
        /**
         * HTMLElement where View is rendered at
         */
        let leaf = ViewManager.getMainLeaf() as WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement };
        const crrSplitPos = ViewManager.getLeafSplitPosition(leaf);
        /**
         * A split is a container for leaf nodes that slides in when clicking the collapse button, except for the root split (markdown editor). There are three types: left, root, and right.
         */
        const crrSplit = crrSplitPos && this.app.workspace[`${crrSplitPos}Split`];

        if (!leaf) {
            leaf = await ViewManager.initView() as WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement };
            const leafActive = leaf.tabHeaderEl.className.includes('is-active');
            if ((crrSplit as any)?.collapsed || !leafActive) {
                ViewManager.revealView();
            }

            return;
        }

        const leafActive = leaf.tabHeaderEl.className.includes('is-active');

        // Scnearios
        // eval root split
        if (crrSplit instanceof WorkspaceRoot) {
            if (leafActive) {
                // 1. root split && leaf active
                leaf.view.unload();
                await ViewManager.initView({ active: false });
            } else {
                // 2. root split && leaf NOT active
                ViewManager.revealView();
            }

            return;
        }

        // eval left or right split
        // only leftSplit and rightSplit can be collapsed
        if (!crrSplit?.collapsed) {
            if (leafActive) {
                // 3. crr split open and leaf active
                crrSplit?.collapse();
            } else {
                // 4. crr split open and leaf NOT active
                ViewManager.revealView();
            }
        } else {
            // 5. crr split collapsed
            ViewManager.revealView();
        }
    }

    public getTheme() {
        return (this.app as any).getTheme() as string
    }

    // registered events
    registerEvents() {
        this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source, leaf) => this.onFileMenu(menu, file as TFile, source, leaf)))

        this.registerEvent(
            this.app.workspace.on('css-change', () => {
                const crrTheme = this.getTheme();

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
        this.registerEvent(
            this.app.metadataCache.on('changed', (file: TFile) => this.onMetadataChanged(file))
        )
    }

    private async onFileMenu(_menu: Menu, file: TFile, source: string, leaf?: WorkspaceLeaf) {
        if (!(file instanceof TFile)) return;
        const menu = _menu as Menu & { dom: Element; bgEl: Element }

        const { isValid, granularity, date } = isValidPeriodicNote(file.basename);
        const activeCalendarView = window.app.workspace.getActiveViewOfType(CalendarView)
        if (typeof isValid === 'boolean' && date && granularity) {
            // Reveal on calendar
            if (!activeCalendarView) {
                menu.addItem((item) =>
                    item.setSection("open")
                        .setTitle("Reveal on calendar")
                        .setIcon("lucide-calendar")
                        .onClick(() => {
                            ViewManager.revealView();
                            activeFileStore.update((d) => {
                                if (d) {
                                    d.file = file;
                                }
                                return d
                            })
                            displayedDateStore.set(moment())
                        })
                )
            }
            // Add custom "Add Sticker" option
            menu.addItem((item) =>
                item.setSection("action")
                    .setTitle("Add Sticker")
                    .setIcon("lucide-smile-plus")
                    .onClick((evt) => {
                        evt.preventDefault()
                        evt.stopPropagation()

                        const fileData = getFileData(granularity, date);
                        spFileDataStore.set(fileData);

                        if (menu.dom || menu.bgEl) {
                            Popover.create({
                                id: STICKER_POPOVER_ID,
                                view: {
                                    Component: StickerPopoverComponent,
                                },
                            }).open(menu.dom || menu.bgEl)
                        }
                    })
            );
        }

        // preview

        // Open on preview
        const crrActiveLeaf = window.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
        const crrActiveLeafId = (crrActiveLeaf as any)?.id as string | null;
        const previewLeafId = (get(previewLeafStore)?.leaf as any)?.id as string | null;
        const crrActiveLeafIsPreview = crrActiveLeafId && previewLeafId && (crrActiveLeafId === previewLeafId)
        if (get(settingsStore).preview.enabled && !crrActiveLeafIsPreview) {
            menu.addItem((item) =>
                item.setSection("open")
                    .setTitle("Open in preview panel")
                    .setIcon("lucide-eye")
                    .onClick(async () => {
                        if (!get(mainLeafStore)?.visible) {
                            await ViewManager.revealView();
                        }
                        ViewManager.restartPreview(file, true)
                    })
            );
        }
    }

    private onFileCreated(file: TFile) {
        if (get(internalFileModStore) === 'created') return;


        if (this.app.workspace.layoutReady) {
            if (file.extension !== 'md') return;

            const { isValid, date, granularity, format } = isValidPeriodicNote(file.basename);

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
                extractAndReplaceTODOItems(date, granularity, file)
            }
        }
    }

    private async onFileDeleted(file: TFile): Promise<void> {
        if (get(internalFileModStore) === 'deleted') return;

        if (this.app.workspace.layoutReady) {
            if (file.extension !== 'md') return;

            const { granularity, format } = isValidPeriodicNote(file.basename);

            if (granularity && format) {
                settingsStore.deleteFilepath(file.path, format.value)
            }
            this.closePreviewOnFileDeleted(file)

            // reset file state
            // this will add some cognitive load for sure
            activeFileStore.set({ file: null, date: null, granularity: null })
            timelineParentFileStore.set(null)
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

    private onMetadataChanged(file: TFile) {
        internalFileModStore.set({ modified: Math.random() })
    }

    private closePreviewOnFileDeleted(file: TFile) {
        const previewLeaf = ViewManager.searchPreviewLeaf(file)

        previewLeaf && ViewManager.cleanupPreview({ leaf: previewLeaf });
        processingPreviewChangeStore.set(true)
        settingsStore.update((s) => {
            s.preview.open = false;
            return s;
        });
    }
}
