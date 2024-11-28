import { DEFAULT_SETTINGS, settingsStore, SettingsTab, type ISettings } from '@/settings';
import moment from 'moment';
import { Plugin, TFile, WorkspaceLeaf, WorkspaceRoot } from 'obsidian';
import { mount, unmount, type SvelteComponent } from 'svelte';
import { get } from 'svelte/store';
import { CALENDAR_POPOVER_ID, CALENDAR_RIBBON_ID, granularities, LEAF_TYPE, PREVIEW_CONTROLS_TYPE } from './constants';
import { createNote, createOrOpenNote, getFileData, getStartupNoteGranularity, IGranularity } from './io';
import { getPeriodicityFromGranularity } from './io/parse';
import type { IPeriodicity } from './io/types';
import locales from './locales';
import { PeriodSettings } from './settings';
import {
    activeFilepathStore,
    isPreviewMaximizedStore,
    pluginClassStore,
    previewLeafStore,
    previewSplitDirectionStore,
    processingPreviewChangeStore,
    themeStore,
    updateLocale,
    updateWeekdays,
    updateWeekStart
} from './stores';
import { PreviewControls, View } from './ui';
import { createNldatePickerDialog } from './ui/modals/nldate-picker';
import { getBehaviorInstance, getPopoverInstance, Popover } from './ui/popovers';
import { capitalize, getDailyNotesPlugin } from './utils';
import { CalendarView } from './view';

export default class PeriodicNotesCalendarPlugin extends Plugin {
    popovers: Record<string, SvelteComponent | null> = {};
    popoversCleanups: (() => void)[] = [];
    popoverAutoUpdateCleanup: (() => void) | null = null;

    onunload() {
        ViewManager.unload();
        this.popoversCleanups.forEach((cleanup) => cleanup());
    }

    async onload() {
        await this.loadSettings();

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

        this.handleRibbon();

        // register view and preview
        // register a view under a specific leaf type so obsidian knows to render it when calling `setViewState` with LEAF_TYPE
        this.registerView(LEAF_TYPE, (leaf) => new CalendarView(leaf, this));

        // Commands
        this.addCommand({
            id: 'open-calendar-view',
            name: 'Toggle calendar view',
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
            // TODO: reword
            name: 'Open a Periodic Note based on Natural Language Date selection',
            callback: createNldatePickerDialog,
        });

        // add quick locales switch commands
        if (get(settingsStore).allowLocalesSwitchFromCommandPalette) {
            window.moment.locales().forEach((momentLocale) => {
                this.addCommand({
                    id: `switch-to - ${momentLocale
                        } -locale`,
                    name: `Switch to ${locales.get(momentLocale) || momentLocale} locale`,
                    callback: () => {
                        updateLocale(momentLocale);
                        updateWeekStart();
                        updateWeekdays();
                    }
                });
            });
        }

        this.app.workspace.onLayoutReady(() => {
            ViewManager.initView({ active: false });

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
                    confirmBeforeCreateOverride: false
                });
            }
        });
    }

    async loadSettings() {
        const settings = (await this.loadData()) as ISettings;
        !settings && (await this.saveData(DEFAULT_SETTINGS));

        settingsStore.update((old) => ({
            ...old,
            ...(settings || {})
        }));
    }

    async saveSettings(newSettings: ISettings) {
        await this.saveData(newSettings);
    }

    handleRibbon() {
        const ribbonEl = this.addRibbonIcon('dice', 'Open calendar', (ev) => {
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

    revealView() {
        // get calendar view and set it as active
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(LEAF_TYPE)[0]);
        this.app.workspace.getLeavesOfType(LEAF_TYPE)[0].setViewState({
            type: LEAF_TYPE,
            active: true
        });
    }

    async toggleView() {
        /**
         * HTMLElement where View is rendered at
         */
        const leaf = this.app.workspace.getLeavesOfType(LEAF_TYPE)[0] as
            | (WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement })
            | undefined;

        if (!leaf) {
            await ViewManager.initView();

            return;
        }

        const getSplitPos = () => {
            const closestWorkspaceSplitClassName =
                leaf.containerEl.closest('.workspace-split')?.className;

            if (closestWorkspaceSplitClassName?.includes('left')) {
                return 'left';
            }

            if (closestWorkspaceSplitClassName?.includes('right')) {
                return 'right';
            }

            return 'root';
        };

        /**
         * The worskpace split where leaf is currently attached to
         * based on closest workspace split className
         */
        const crrSplitPos = getSplitPos();
        /**
         * A split is a container for leaf nodes that slides in when clicking the collapse button, except for the root split (markdown editor). There are three types: left, root, and right.
         */
        const crrSplit = this.app.workspace[`${crrSplitPos}Split`];

        const leafActive = leaf.tabHeaderEl.className.includes('is-active');

        // Scnearios
        // eval root split
        if (crrSplit instanceof WorkspaceRoot) {
            if (leafActive) {
                // 1. root split && leaf active
                leaf.view.unload();
                await ViewManager.initView({ active: false });

                return;
            }
            // 2. root split && leaf NOT active
            this.revealView();

            return;
        }

        // eval left or right split
        // only leftSplit and rightSplit can be collapsed
        if (!crrSplit.collapsed) {
            if (leafActive) {
                // 3. crr split open and leaf active
                crrSplit.collapse();
            } else {
                // 4. crr split open and leaf NOT active
                this.revealView();
            }
        } else {
            // 5. crr split collapsed
            this.revealView();
        }
    }

    public getTheme() {
        return (this.app as any).getTheme() as string
    }
}

export class ViewManager {
    static mainLeaf: WorkspaceLeaf | null;
    static previewControlsComponent: Record<string, any> | null;
    static previewTabHeaderEl: HTMLElement | null;
    static previewLeafCleanups: (() => void)[] = [];

    static async initView({ active }: { active: boolean } = { active: true }) {
        this.cleanup()

        const leafPosition = get(settingsStore).viewLeafPosition as ISettings["viewLeafPosition"];
        if (leafPosition === 'root') {
            this.mainLeaf = window.app.workspace.getLeaf('tab')
            this.mainLeaf?.setViewState({
                type: LEAF_TYPE,
                active
            })
        } else {
            this.mainLeaf = window.app.workspace[`get${capitalize(leafPosition) as "Left" | "Right"}Leaf`](false);
            this.mainLeaf?.setViewState({
                type: LEAF_TYPE,
                active
            });
        }

        if (this.mainLeaf && get(settingsStore).preview.enabled) {
            const cleanup = this.setupVisibilityTracking();
            this.previewLeafCleanups.push(cleanup);
        } else {
            this.cleanupPreview();
        }
    }

    private static setupVisibilityTracking(): () => void {
        // Handler for layout changes
        const handleLayoutChange = async () => {
            const mainLeaf = this.mainLeaf as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number } | null;
            const previewLeaf = ViewManager.searchPreviewLeaf()
            const mainLeafvisible = mainLeaf && this.isLeafVisible(mainLeaf)
            const previewLeafVisible = previewLeaf && ViewManager.isLeafVisible(previewLeaf)

            // check if preview is maximized
            const isPreviewMaximized = this.checkIfPreviewIsMaximized(previewLeaf);
            isPreviewMaximizedStore.set(isPreviewMaximized)

            // check preview's split direction
            const previewSplitDirection = this.getPreviewSplitDirection(previewLeaf);
            previewSplitDirection && previewSplitDirectionStore.set(previewSplitDirection);

            // avoid toggling preview if it has transitioned to an expanded-like state (moved to another tab)
            if (isPreviewMaximized) {
                settingsStore.update(s => {
                    s.preview.visible = false;
                    return s;
                })
                processingPreviewChangeStore.set(false);
                return;
            };
            // very especific check for when an expanded preview window is moved to a split window
            if (previewLeafVisible && (get(settingsStore).preview.defaultExpansionMode === "maximized" && !isPreviewMaximized)) {
                settingsStore.update(s => {
                    s.preview.visible = true;
                    s.preview.tabHeaderVisible = true;
                    return s;
                })
                return;
            }

            if (!get(processingPreviewChangeStore)) {
                const expandMode = get(settingsStore).preview.defaultExpansionMode
                if (!previewLeaf) {
                    const storedPreviewLeaf = get(previewLeafStore)?.leaf
                    ViewManager.cleanupPreview({ leaf: storedPreviewLeaf! });
                    return;
                }
                if (expandMode === 'split') {
                    if (mainLeafvisible && !previewLeaf && get(settingsStore).preview.visible) {
                        ViewManager.initPreview();
                        return;
                    }
                }
                if (!mainLeafvisible && previewLeaf && get(settingsStore).preview.visible) {
                    ViewManager.cleanupPreview({ leaf: previewLeaf });
                    return;
                }
            }
        };

        // Register event handlers
        // window.app.workspace.on('layout-change', handleLayoutChange);
        window.app.workspace.on('resize', handleLayoutChange);

        // Initial check
        // handleLayoutChange();

        // Return cleanup function
        return () => {
            window.app.workspace.off('layout-change', handleLayoutChange);
            window.app.workspace.off('resize', handleLayoutChange);
        };
    }

    private static isLeafVisible(leaf: WorkspaceLeaf): boolean {
        const _leaf = leaf as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number };
        // Check if the leaf is in the DOM and visible
        return (
            _leaf.containerEl.style.display !== 'none' &&
            _leaf.width > 0 &&
            _leaf.height > 0
        );
    }

    static async initPreview(defaultFile?: TFile) {
        processingPreviewChangeStore.set(true);

        await this.tryPreviewCleanup({ defaultFile });

        if (!get(settingsStore).preview.visible) {
            const file: TFile | null = defaultFile || await this.getFile();

            if (file && this.mainLeaf) {
                const viewLeafPosition = get(settingsStore).viewLeafPosition
                const splitMode = viewLeafPosition === 'root' ? get(settingsStore).preview.centerDefaultSplitMode : get(settingsStore).preview.defaultSplitMode
                const expandMode = get(settingsStore).preview.defaultExpansionMode;

                let previewLeaf: WorkspaceLeaf | null = null;
                if (expandMode === 'maximized') {
                    if (viewLeafPosition === 'root') {
                        previewLeaf = window.app.workspace.getLeaf('tab')
                    } else {
                        previewLeaf = window.app.workspace[`get${capitalize(viewLeafPosition) as "Left" | "Right"}Leaf`](false);
                    }
                } else {
                    previewLeaf = window.app.workspace.createLeafBySplit(this.mainLeaf, splitMode);
                }

                if (previewLeaf) {
                    this.setupOpenPreviewLeaf(file, previewLeaf)
                }
            }
        }

        processingPreviewChangeStore.set(false);
    }

    static cleanup() {
        window.app.workspace.detachLeavesOfType(LEAF_TYPE);
        this.tryPreviewCleanup();
        settingsStore.update(s => {
            s.preview.visible = false
            return s
        })
    }
    static async tryPreviewCleanup({ leaf, defaultFile }: { leaf?: WorkspaceLeaf, defaultFile?: TFile } = {}) {
        const previewLeaf = leaf || this.searchPreviewLeaf();
        if (previewLeaf) {
            if (this.checkIfPreviewIsMaximized(previewLeaf)) {
                const file = defaultFile || await this.getFile()
                if (file) {
                    this.setupOpenPreviewLeaf(file, previewLeaf)
                }
            } else {
                this.cleanupPreview({ leaf: previewLeaf });
            }
        }
    }
    static checkIfPreviewIsMaximized(previewLeaf: WorkspaceLeaf | null) {
        const tabHeaderLeaves = (previewLeaf?.parent as any)?.children as WorkspaceLeaf[] | undefined;
        let previewIsCalendarLeafSibling = false;
        if (tabHeaderLeaves) {
            for (let i = 0; i < tabHeaderLeaves.length; i++) {
                if (previewIsCalendarLeafSibling) break;

                const leaf = tabHeaderLeaves[i] as WorkspaceLeaf & { containerEl: HTMLElement };
                const childNodes = leaf.containerEl?.childNodes as unknown as HTMLElement[]
                for (let j = 0; j < childNodes.length; j++) {
                    const el = childNodes[j];
                    if (el.dataset.type === LEAF_TYPE) {
                        previewIsCalendarLeafSibling = true
                        break;
                    }
                }
            }
        }
        return previewIsCalendarLeafSibling
    }
    static getPreviewSplitDirection(previewLeaf: WorkspaceLeaf | null) {
        return ((previewLeaf?.parent?.parent as any)?.direction || null) as 'vertical' | 'horizontal' | null;
    }
    /**
        * Passing `restart` sets `s.preview.visible` to null which signals `initPreview` to create a new preview split.
        * Effectively restarting the preview
    */
    static cleanupPreview({ leaf }: { leaf?: WorkspaceLeaf } = {}) {
        processingPreviewChangeStore.set(true);

        const previewLeaf = leaf || this.searchPreviewLeaf()
        previewLeaf?.detach();
        this.previewControlsComponent && unmount(this.previewControlsComponent)
        this.previewControlsComponent = null;
        previewLeafStore.set(null);
        this.previewTabHeaderEl = null

        settingsStore.update(s => {
            s.preview.lastPreviewFilepath = ''
            s.preview.visible = false
            return s
        })

        processingPreviewChangeStore.set(false);
    }
    static searchPreviewLeaf(file?: TFile) {
        let previewLeafFound = false;
        let previewLeaf: WorkspaceLeaf | null = get(previewLeafStore)?.leaf || null;
        window.app.workspace.iterateAllLeaves((leaf) => {
            if (
                !previewLeafFound
                && leaf.getViewState().type === 'markdown'
                && leaf.view?.containerEl?.dataset?.type !== LEAF_TYPE
                && (leaf as WorkspaceLeaf & { containerEl: HTMLElement })?.containerEl?.closest(".workspace-split")?.className.includes(`mod-${get(settingsStore).viewLeafPosition}`)
                && (this.previewControlsComponent ? Array.from(leaf.view.containerEl.childNodes).find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE) : true)
            ) {
                const leafFile = file || (leaf.view as any).file as TFile | undefined;
                if (leafFile?.path === get(settingsStore).preview.lastPreviewFilepath) {
                    previewLeaf = leaf
                    previewLeafFound = true;
                }
            }
        })
        return previewLeaf as WorkspaceLeaf | null;
    }

    static togglePreviewTabHeader() {
        const previewLeaf = ViewManager.searchPreviewLeaf()
        const isPreviewMaximized = this.checkIfPreviewIsMaximized(previewLeaf);
        if (isPreviewMaximized) return;

        this.previewTabHeaderEl = (previewLeaf?.parent as any).tabHeaderContainerEl as HTMLElement | null
        if (this.previewTabHeaderEl) {
            if (!get(settingsStore).preview.tabHeaderVisible) {
                this.previewTabHeaderEl.style.display = 'none'
            } else {
                this.previewTabHeaderEl.style.display = 'flex'
            }
        }
    }

    private static async getFile() {
        let file: TFile | null = null;
        const enabledGranularities: IGranularity[] = [];
        Object.entries(get(settingsStore).periods).forEach((entry) => {
            const [g, s] = entry as [IGranularity, PeriodSettings];
            if (s.enabled) {
                enabledGranularities.push(g);
                if (!file) {
                    file = getFileData(g, moment()).file;
                }
            }
        })
        if (!file && enabledGranularities.length > 0) {
            file = await createNote(enabledGranularities[0], moment())
        }

        return file;
    }
    private static setupOpenPreviewLeaf(file: TFile, previewLeaf: WorkspaceLeaf) {
        previewLeaf.openFile(file);
        previewLeafStore.set({ leaf: previewLeaf, file });
        settingsStore.update(s => {
            s.preview.visible = true
            s.preview.lastPreviewFilepath = file!.path
            return s
        });
        activeFilepathStore.set(file.path);

        this.togglePreviewTabHeader()

        // add overlay control buttons
        if (!this.previewControlsComponent) {
            this.previewControlsComponent = mount(PreviewControls, {
                target: previewLeaf.view.containerEl,
            })
        }
    }

    static cleaunupPreviewEvHandlers() {
        this.previewLeafCleanups.length > 0 && this.previewLeafCleanups.forEach((cleanup) => cleanup());
        this.previewLeafCleanups = [];
    }

    // Call this when unloading the plugin
    static unload() {
        this.cleanup();
    }
}
