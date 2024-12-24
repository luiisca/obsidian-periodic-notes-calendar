import { MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";

import { LEAF_TYPE, TIMELINE_TYPE } from "@/constants";
import { isValidPeriodicNote } from "@/io/validation";
import { settingsStore } from "@/settings";
import moment from "moment";
import { get } from "svelte/store";
import Timeline from "./Timeline.svelte";
import { isMobile } from "@/utils";
import { ViewManager } from "../view";

export default class TimelineManager {
    static timelineComponents: Record<string, Record<string, any>> = {}

    static initAll(): void {
        if (get(settingsStore).timeline.enabled) {
            window.app.workspace.iterateAllLeaves((leaf) => {
                const leafView = leaf.view as MarkdownView;
                const isLeafViewMarkdown = leaf.getViewState().type === 'markdown'
                const isLeafCalendar = leafView?.containerEl?.dataset?.type === LEAF_TYPE

                if (!isLeafViewMarkdown || isLeafCalendar) return;

                this.tryMountTimeline(leaf);
            });
        }
    }
    static tryMountTimeline(leaf: WorkspaceLeaf, _file?: TFile) {
        const file = _file || ViewManager.getFileFromLeaf(leaf);
        if (!file) return;

        const closestWorkspaceClassname = isMobile() ? ".workspace-drawer" : ".workspace-split"
        const leafContainerClassname =
            (leaf as WorkspaceLeaf & { containerEl: HTMLElement })?.containerEl?.closest(closestWorkspaceClassname)?.className;

        const { isValid, granularity, date } = isValidPeriodicNote(file.basename);
        if ((typeof isValid === 'boolean' && date && granularity) || get(settingsStore).timeline.displayOnRestNotes) {
            // mount timeline to any markdown view without one
            this.isMounted(leaf, true);
            const isPeriodic = Boolean(typeof isValid === 'boolean' && date && granularity);
            const enoughRoom = leaf.view.containerEl.getBoundingClientRect().width > 640;

            this.timelineComponents[file.path] = mount(Timeline, {
                target: leaf.view.containerEl,
                props: {
                    granularity: granularity || "day",
                    initialDate: date || moment(),
                    isPeriodic,
                    isSide: leafContainerClassname?.includes(`mod-left`) || leafContainerClassname?.includes(`mod-right`),
                    viewModeOverride: enoughRoom ? (isPeriodic ? get(settingsStore).timeline.viewMode : get(settingsStore).timeline.restViewMode) : 'collapsed'
                },
            })
        } else {
            this.cleanup(leaf);
        }
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

    static restart() {
        this.unmountAll();
        this.initAll();
    }

    static unmountAll() {
        for (const timeline of Object.values(this.timelineComponents)) {
            unmount(timeline);
        }
        this.timelineComponents = {};
    }

    static unload() {
        this.unmountAll();
    }
}
