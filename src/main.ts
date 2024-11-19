import { DEFAULT_SETTINGS, settingsStore, SettingsTab, type ISettings } from '@/settings';
import moment from 'moment';
import { Plugin, TFile, WorkspaceLeaf, WorkspaceRoot } from 'obsidian';
import { mount, unmount, type SvelteComponent } from 'svelte';
import { get } from 'svelte/store';
import { CALENDAR_POPOVER_ID, CALENDAR_RIBBON_ID, granularities, LEAF_TYPE } from './constants';
import { createOrOpenNote, getFileData, getStartupNoteGranularity, IGranularity } from './io';
import { getPeriodicityFromGranularity } from './io/parse';
import type { IPeriodicity } from './io/types';
import locales from './locales';
import { PeriodSettings } from './settings';
import {
    pluginClassStore,
    previewLeafStore,
    themeStore,
    updateLocale,
    updateWeekdays,
    updateWeekStart
} from './stores';
import TopPreview from './TopPreview.svelte';
import { createNldatePickerDialog } from './ui/modals/nldate-picker';
import { getBehaviorInstance, getPopoverInstance, Popover } from './ui/popovers';
import { capitalize, getDailyNotesPlugin } from './utils';
import { CalendarView } from './view';
import View from './View.svelte';

export default class PeriodicNotesCalendarPlugin extends Plugin {
    popovers: Record<string, SvelteComponent | null> = {};
    popoversCleanups: (() => void)[] = [];
    popoverAutoUpdateCleanup: (() => void) | null = null;

    onunload() {
        console.log('ON Unload ⛰️');

        ViewManager.unload();
        this.popoversCleanups.forEach((cleanup) => cleanup());
    }

    async onload() {
        await this.loadSettings();
        console.log('ON Load 🫵');

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
            console.log('ON Layout REady 🙌');

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
                console.log("🎉 [layout ready] about to open or create note");
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
        console.log("✅ saveSettings triggered", newSettings);
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
        console.log('crrSplitPos', crrSplitPos);
        /**
         * A split is a container for leaf nodes that slides in when clicking the collapse button, except for the root split (markdown editor). There are three types: left, root, and right.
         */
        const crrSplit = this.app.workspace[`${crrSplitPos}Split`];
        console.log('crrSplit', crrSplit);

        const leafActive = leaf.tabHeaderEl.className.includes('is-active');
        console.log('leafActive', leafActive);

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
    static previewComponent: Record<string, any>;

    static previewLeafCleanups: (() => void)[] = [];
    static async initView({ active }: { active: boolean } = { active: true }) {
        this.cleanupExistingViews()

        const leafPosition = capitalize(get(settingsStore).viewLeafPosition) as ISettings["viewLeafPosition"];
        if (leafPosition === 'center') {
            const rootLeaves: WorkspaceLeaf[] = []
            window.app.workspace.iterateRootLeaves((leaf) => rootLeaves.push(leaf))
            this.mainLeaf = rootLeaves[0];
            this.mainLeaf.setViewState({
                type: LEAF_TYPE,
                active
            })
        } else {
            this.mainLeaf = window.app.workspace[`get${leafPosition as "Left" | "Right"}Leaf`](false);
            await this.mainLeaf?.setViewState({
                type: LEAF_TYPE,
                active
            });
        }

        if (this.mainLeaf) {
            const cleanup = this.setupVisibilityTracking();
            this.previewLeafCleanups.push(cleanup);
        }
    }

    private static async initPreview() {
        const periodsSettings = get(settingsStore).periods;
        let file: TFile | null = null;
        Object.entries(periodsSettings).find((entry) => {
            const [g, s] = entry as [IGranularity, PeriodSettings];
            if (s.preview.enabled) {
                file = getFileData(g, moment()).file;
                return true;
            }
        })

        // TODO: check settings.autoCreate to create a new file if none found
        if (file && this.mainLeaf) {
            const previewLeaf = window.app.workspace.createLeafBySplit(this.mainLeaf, 'horizontal');
            previewLeaf?.openFile(file);

            previewLeafStore.set({ leaf: previewLeaf, file });
            settingsStore.update(s => {
                s.lastPreviewFilepath = file!.path
                return s
            });

            const tabHeaderContainerEl = (previewLeaf.parent as any).tabHeaderContainerEl as HTMLElement | null
            tabHeaderContainerEl?.remove()

            // add extra buttons at the top
            this.previewComponent = mount(TopPreview, {
                target: previewLeaf.view.containerEl,
            })
        }
    }

    private static setupVisibilityTracking(): () => void {
        // Handler for layout changes
        const handleLayoutChange = async () => {
            const previewLeaf = get(previewLeafStore)?.leaf;
            const isMainVisible = this.mainLeaf && this.isLeafVisible(this.mainLeaf);

            if (isMainVisible && !previewLeaf) {
                this.initPreview();
            }
            if (!isMainVisible && previewLeaf) {
                previewLeaf.detach();
                unmount(this.previewComponent);
                previewLeafStore.set(null);
            }
        };

        // Register event handlers
        window.app.workspace.on('layout-change', handleLayoutChange);
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


    private static cleanupExistingViews() {
        // Detach all leaves of both types
        window.app.workspace.detachLeavesOfType(LEAF_TYPE);

        let previewLeafClosed = false;
        window.app.workspace.iterateAllLeaves((leaf) => {
            if (!previewLeafClosed && leaf.getViewState().type === 'markdown') {
                const leafFile = (leaf.view as any).file as TFile;
                if (leafFile.path === get(settingsStore).lastPreviewFilepath) {
                    leaf.detach();
                    previewLeafStore.set(null);
                    previewLeafClosed = true;
                    settingsStore.update(s => {
                        s.lastPreviewFilepath = ''
                        return s
                    })
                }
            }
        })

        this.previewLeafCleanups.length > 0 && this.previewLeafCleanups.forEach((cleanup) => cleanup());
        this.previewLeafCleanups = [];
    }

    // Call this when unloading the plugin
    static unload() {
        this.cleanupExistingViews();
    }
}
