import { DEFAULT_SETTINGS, settingsStore, SettingsTab, type ISettings } from '@/settings';
import { Plugin, WorkspaceLeaf, WorkspaceRoot } from 'obsidian';
import { type SvelteComponent } from 'svelte';
import { get } from 'svelte/store';
import { CALENDAR_POPOVER_ID, CALENDAR_RIBBON_ID, granularities, LEAF_TYPE } from './constants';
import { createOrOpenNote, getStartupNoteGranularity } from './io';
import { getPeriodicityFromGranularity } from './io/parse';
import type { IPeriodicity } from './io/types';
import {
    pluginClassStore,
    themeStore
} from './stores';
import { View, ViewManager } from './ui';
import TimelineManager from './ui/components/timeline/manager';
import { createNldatePickerDialog } from './ui/modals/nldate-picker';
import { getBehaviorInstance, getPopoverInstance, Popover } from './ui/popovers';
import { getDailyNotesPlugin, handleLocaleCommands } from './utils';
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
            ViewManager.initView({ active: false });
            TimelineManager.initTimeline()

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
                // TODO: modify to open in preview if 
                // get(settingsStore).preview.openNotesInPreview enabled
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
}
