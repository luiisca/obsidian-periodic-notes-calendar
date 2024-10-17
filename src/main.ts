import { DEFAULT_SETTINGS, settingsStore, SettingsTab, type ISettings } from '@/settings';
import { Notice, Plugin, WorkspaceLeaf, WorkspaceRoot } from 'obsidian';
import type { SvelteComponent } from 'svelte';
import { get } from 'svelte/store';
import { CALENDAR_POPOVER_ID, granularities, NLDATES_PLUGIN_ID, VIEW_TYPE } from './constants';
import { createOrOpenNote, getStartupNoteGranularity } from './io';
import { getPeriodicityFromGranularity } from './io/parse';
import type { IPeriodicity } from './io/types';
import locales from './locales';
import {
    pluginClassStore,
    themeStore,
    updateLocale,
    updateWeekdays,
    updateWeekStart
} from './stores';
import { createNldatePickerDialog } from './ui/modals/nldate-picker';
import { getPopoverInstance, Popover } from './ui/popovers';
import { capitalize, getDailyNotesPlugin, getPlugin } from './utils';
import { CalendarView } from './view';
import View from './View.svelte';

export default class PeriodicNotesCalendarPlugin extends Plugin {
    popovers: Record<string, SvelteComponent | null> = {};
    popoversCleanups: (() => void)[] = [];
    popoverAutoUpdateCleanup: (() => void) | null = null;

    onunload() {
        console.log('ON Unload ⛰️');

        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => leaf.detach());

        this.popoversCleanups.length > 0 && this.popoversCleanups.forEach((cleanup) => cleanup());
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

        // register view
        this.registerView(VIEW_TYPE, (leaf) => new CalendarView(leaf, this));

        // Commands
        this.addCommand({
            id: 'open-calendar-view',
            name: 'Open calendar view',
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

        const nlDatesPlugin = await getPlugin(NLDATES_PLUGIN_ID);
        this.addCommand({
            id: 'open-nldate-note',
            name: 'Open a Periodic Note based on Natural Language Date selection',
            callback: () => {
                if (nlDatesPlugin) {
                    createNldatePickerDialog();
                } else {
                    new Notice(`Please install '${NLDATES_PLUGIN_ID}' plugin to use this command`)
                }
            }
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

            this.initView({ active: false });

            if (get(settingsStore).openPopoverOnRibbonHover) {
                Popover.create({
                    id: CALENDAR_POPOVER_ID,
                    view: {
                        Component: View
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

            if (get(settingsStore).viewMode === "dedicated-panel") {
                this.toggleView();

                if (get(settingsStore).openPopoverOnRibbonHover && calendarPopover?.opened) {
                    calendarPopover.close();
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
                            Component: View
                        }
                    }).open(target);
                } else {
                    calendarPopover?.toggle(target)
                }
            }
        });

        ribbonEl.id = `${CALENDAR_POPOVER_ID}-ribbon-ref-el`
    }

    async initView({ active }: { active: boolean } = { active: true }) {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);

        await this.app.workspace[`get${capitalize(get(settingsStore).viewLeafPosition) as "Left" | "Right"}Leaf`](false)?.setViewState({
            type: VIEW_TYPE,
            active
        });
    }
    revealView() {
        // get calendar view and set it as active
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]);
        this.app.workspace.getLeavesOfType(VIEW_TYPE)[0].setViewState({
            type: VIEW_TYPE,
            active: true
        });
    }

    async toggleView() {
        /**
         * HTMLElement where View is rendered at
         */
        const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0] as
            | (WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement })
            | undefined;

        if (!leaf) {
            await this.initView();

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
                await this.initView({ active: false });

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
