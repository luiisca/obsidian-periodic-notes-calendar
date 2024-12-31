import { FileView, MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";

import { LEAF_TYPE, TIMELINE_TYPE } from "@/constants";
import { IGranularity } from "@/io";
import { isValidPeriodicNote } from "@/io/validation";
import { settingsStore } from "@/settings";
import { displayedDateStore, timelineParentFileStore } from "@/stores";
import { crrTabStore, getEnabledPeriods, periodTabs } from "@/stores/calendar";
import { isMobile } from "@/utils";
import moment, { Moment } from "moment";
import { get } from "svelte/store";
import { ViewManager } from "../view";
import Timeline from "./Timeline.svelte";
import { PluginService } from "@/app-service";

export default class TimelineManager {
    static timelineComponents: Record<string, Record<string, any>> = {}

    static initAll(): void {
        if (get(settingsStore).timeline.enabled) {
            PluginService.getPlugin()?.app.workspace.iterateAllLeaves((leaf) => {
                const leafView = leaf.view as MarkdownView;
                const isLeafViewMarkdown = leaf.getViewState().type === 'markdown'
                const isLeafCalendar = leafView?.containerEl?.dataset?.type === LEAF_TYPE

                if (!isLeafViewMarkdown || isLeafCalendar) return;

                this.tryMount(leaf);
            });
        }
    }
    static tryMount(leaf: WorkspaceLeaf, _file?: TFile) {
        const file = _file || ViewManager.getFileFromLeaf(leaf);
        if (!file) return;

        const { isValid, granularity, date } = isValidPeriodicNote(file.basename);
        const isPeriodic = Boolean(typeof isValid === 'boolean' && date && granularity);
        if (isPeriodic || get(settingsStore).timeline.displayOnRestNotes) {
            this.mount(
                leaf,
                {
                    isPeriodic,
                    granularity,
                    date
                },
                file
            );
        } else {
            this.cleanup(leaf);
        }
    }
    static mount(leaf: WorkspaceLeaf, periodicData: { isPeriodic: boolean, granularity: IGranularity | null, date: Moment | null } | null = null, file: TFile) {
        const closestWorkspaceClassname = isMobile() ? ".workspace-drawer" : ".workspace-split"
        const leafContainerClassname =
            (leaf as WorkspaceLeaf & { containerEl: HTMLElement })?.containerEl?.closest(closestWorkspaceClassname)?.className;

        this.isMounted(leaf, true);
        const enoughRoom = leaf.view.containerEl.getBoundingClientRect().width > 640;

        this.timelineComponents[file.path] = mount(Timeline, {
            target: leaf.view.containerEl,
            props: {
                granularity: periodicData?.granularity || "day",
                initialDate: periodicData?.date || moment(),
                isPeriodic: periodicData?.isPeriodic,
                isSide: leafContainerClassname?.includes(`mod-left`) || leafContainerClassname?.includes(`mod-right`),
                viewModeOverride: enoughRoom ? (periodicData?.isPeriodic ? get(settingsStore).timeline.viewMode : get(settingsStore).timeline.restViewMode) : 'collapsed'
            },
        })

    }
    static isMounted(leaf: WorkspaceLeaf | null, remove: boolean = false) {
        if (!leaf) return;

        return Array.from(leaf.view.containerEl.children).find((el: HTMLElement) => {
            if (el.dataset?.type === TIMELINE_TYPE) {
                remove && el.remove();
                return true
            }
        });
    }
    static cleanup(leaf: WorkspaceLeaf | null) {
        if (!leaf) return;

        Array.from(leaf.view.containerEl.children).forEach((el: HTMLElement) => {
            if (el.dataset?.type === TIMELINE_TYPE) {
                el.remove();
            }
        });
    }

    static restart(leaf: WorkspaceLeaf, periodicData: { isPeriodic: boolean, granularity: IGranularity | null, date: Moment | null } | null = null, file: TFile) {
        this.cleanup(leaf)
        this.mount(leaf, periodicData, file)
    }
    static restartAll() {
        this.unmountAll();
        this.initAll();
    }

    static unmountAll() {
        for (const timeline of Object.values(this.timelineComponents)) {
            unmount(timeline);
        }
        this.timelineComponents = {};
    }

    static handleLayoutChange() {
        const prevTimelineParentFile = get(timelineParentFileStore);
        const activeFile = PluginService.getPlugin()?.app.workspace.getActiveFile();
        const crrActiveLeaf = PluginService.getPlugin()?.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
        const leafFile = ViewManager.getFileFromLeaf(crrActiveLeaf)
        const activeLeafContainsActiveFile = activeFile?.path === leafFile?.path

        if (
            !activeFile
            || !leafFile
            || !crrActiveLeaf
            || (prevTimelineParentFile && prevTimelineParentFile.path === leafFile.path)
            || !activeLeafContainsActiveFile
        ) {
            return;
        };


        const { isValid, granularity, date } = isValidPeriodicNote(activeFile.basename);

        if (typeof isValid === "boolean" && date && granularity) {
            TimelineManager.restart(crrActiveLeaf, { isPeriodic: true, granularity, date }, activeFile);

            timelineParentFileStore.set(activeFile)

            if (
                !PluginService.getPlugin()?.app.workspace.layoutReady
                || ViewManager.isMainLeaf(crrActiveLeaf)
                || (!crrActiveLeaf?.view || !(crrActiveLeaf?.view instanceof FileView))
                || ViewManager.isPreviewLeaf(crrActiveLeaf)?.leaf
            ) {
                return
            }

            if (get(settingsStore).syncCalendar) {
                displayedDateStore.set(date!)
                const enabledPeriodsRes = getEnabledPeriods();
                if (enabledPeriodsRes.tabs.includes(granularity as typeof periodTabs[number])) {
                    crrTabStore.set(granularity as typeof periodTabs[number])
                }
            }
        } else {
            if (get(settingsStore).timeline.displayOnRestNotes) {
                // restart timeline view to display today date on rest notes
                TimelineManager.restart(crrActiveLeaf, null, activeFile);

                return;
            }
            if (!TimelineManager.isMounted(crrActiveLeaf)) return;

            TimelineManager.cleanup(crrActiveLeaf);
        }
    }

    static unload() {
        this.unmountAll();
    }
}
