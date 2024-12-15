import { MarkdownView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";

import { LEAF_TYPE } from "@/constants";
import { isValidPeriodicNote } from "@/io/validation";
import { settingsStore } from "@/settings";
import moment from "moment";
import { get } from "svelte/store";
import Timeline from "./Timeline.svelte";

export default class TimelineManager {
    static timelineComponents: Record<string, Record<string, any>> = {}

    static initTimeline(): void {
        if (get(settingsStore).timeline.enabled) {
            window.app.workspace.iterateAllLeaves((leaf) => {
                let isMobile = (window.app as any).isMobile;
                const closestWorkspaceClassname = isMobile ? ".workspace-drawer" : ".workspace-split"
                const leafContainerClassname =
                    (leaf as WorkspaceLeaf & { containerEl: HTMLElement })?.containerEl?.closest(closestWorkspaceClassname)?.className;


                if (
                    leaf.view instanceof MarkdownView
                    && leaf.getViewState().type === 'markdown'
                    && leaf.view?.containerEl?.dataset?.type !== LEAF_TYPE
                ) {
                    const file = leaf.view.file;
                    if (!file) return;

                    const { isValid, granularity, date } = isValidPeriodicNote(file.basename);
                    if ((typeof isValid === 'boolean' && date && granularity) || get(settingsStore).timeline.displayOnRestNotes) {
                        // mount timeline to any markdown view without one
                        const mounted = Array.from(leaf.view.containerEl.children).find(el => {
                            if (el.id.includes(`timeline-container`)) {
                                el.remove();
                                return false;
                            }
                            return false;
                        });
                        if (!mounted) {
                            const isPeriodic = Boolean(typeof isValid === 'boolean' && date && granularity);
                            const enoughRoom = leaf.view.containerEl.getBoundingClientRect().width > 640;

                            this.timelineComponents[file.path] = mount(Timeline, {
                                target: leaf.view.containerEl,
                                props: {
                                    granularity: granularity || "day",
                                    date: date || moment(),
                                    isPeriodic,
                                    isSide: leafContainerClassname?.includes(`mod-left`) || leafContainerClassname?.includes(`mod-right`),
                                    viewModeOverride: enoughRoom ? (isPeriodic ? get(settingsStore).timeline.viewMode : get(settingsStore).timeline.restViewMode) : 'collapsed'
                                },
                            })
                        }
                    } else {
                        leaf.view.containerEl.childNodes.forEach((el: HTMLElement) => {
                            if (el.id?.includes(`timeline-container`)) {
                                el.remove();
                            }
                        })
                    }
                }
            });
        }
    }

    static restart() {
        this.cleanup();
        this.initTimeline();
    }

    static cleanup() {
        for (const timeline of Object.values(this.timelineComponents)) {
            unmount(timeline);
        }
        this.timelineComponents = {};
    }

    static unload() {
        this.cleanup();
    }
}
