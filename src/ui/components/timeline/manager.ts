import { MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";

import { LEAF_TYPE, PREVIEW_CONTROLS_TYPE } from "@/constants";
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
                const leafContainerClassname = (leaf as WorkspaceLeaf & { containerEl: HTMLElement })?.containerEl?.closest(".workspace-split")?.className;
                if (
                    leaf.view instanceof MarkdownView
                    && leaf.getViewState().type === 'markdown'
                    && leaf.view?.containerEl?.dataset?.type !== LEAF_TYPE
                    && !leafContainerClassname?.includes(`mod-left`)
                    && !leafContainerClassname?.includes(`mod-right`)
                    && !Array.from(leaf.view.containerEl.childNodes).find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE)
                ) {
                    const file = leaf.view.file;
                    if (!file) return;

                    const { isValid, granularity, date } = isValidPeriodicNote(file.basename);
                    if ((typeof isValid === 'boolean' && date && granularity) || get(settingsStore).timeline.displayOnAllNotes) {
                        // mount timeline to any markdown view without one
                        const mounted = Array.from(leaf.view.containerEl.children).find(el => {
                            if (el.id.includes(`timeline-container`)) {
                                if (granularity && el.id.includes(granularity)) {
                                    return true
                                } else {
                                    el.remove();
                                    return false;
                                }
                            }
                            return false;
                        });
                        if (!mounted) {
                            this.timelineComponents[file.path] = mount(Timeline, {
                                target: leaf.view.containerEl,
                                props: {
                                    granularity: granularity || "day",
                                    date: date || moment(),
                                },
                            })
                        }
                    }
                }
            });
        }
    }

    static unload() {
        for (const timeline of Object.values(this.timelineComponents)) {
            unmount(timeline);
        }
        this.timelineComponents = {};
    }
}
