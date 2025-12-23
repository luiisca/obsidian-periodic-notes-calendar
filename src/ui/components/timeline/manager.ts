import { FileView, MarkdownView, TFile, WorkspaceLeaf, Platform } from "obsidian";
import { mount, unmount } from "svelte";

import { LEAF_TYPE, TIMELINE_TYPE } from "@/constants";
import { IGranularity } from "@/io";
import { isValidPeriodicNote } from "@/io/validation";
import { settingsStore } from "@/settings";
import { displayedDateStore, timelineParentFileStore } from "@/stores";
import { crrTabStore, getEnabledPeriods, periodTabs } from "@/stores/calendar";

import { get } from "svelte/store";
import { ViewManager } from "../view";
import Timeline from "./Timeline.svelte";
import { PluginService } from "@/app-service";

export default class TimelineManager {
  static components: Record<string, Record<string, unknown>> = {}
  static instance: TimelineManager | null = null;

  constructor() { }

  public mountAll(): void {
    PluginService.getPlugin()?.app.workspace.iterateAllLeaves((leaf) => {
      const isLeafViewMarkdown = leaf.getViewState().type === 'markdown'
      const isLeafCalendar = (leaf.view as MarkdownView)?.containerEl?.dataset?.type === LEAF_TYPE

      if (!isLeafViewMarkdown) return;
      if (isLeafCalendar) return;

      this.tryMount(leaf);
    });
  }

  public tryMount(leaf: WorkspaceLeaf, _file?: TFile) {
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
      this.unmount(leaf);
    }
  }

  public mount(leaf: WorkspaceLeaf, periodicData: { isPeriodic: boolean, granularity: IGranularity | null, date: moment.Moment | null } | null = null, file: TFile) {
    const closestWorkspaceClassname = Platform.isPhone ? ".workspace-drawer" : ".workspace-split"
    const leafContainerClassname =
      (leaf as WorkspaceLeaf & { containerEl: HTMLElement })?.containerEl?.closest(closestWorkspaceClassname)?.className;

    this.isMountedIn(leaf, true);
    const enoughRoom = leaf.view.containerEl.getBoundingClientRect().width > 640;

    TimelineManager.components[file.path] = mount(Timeline, {
      target: leaf.view.containerEl,
      props: {
        granularity: periodicData?.granularity || "day",
        initialDate: periodicData?.date || window.moment(),
        isPeriodic: periodicData?.isPeriodic,
        isSide: leafContainerClassname?.includes(`mod-left`) || leafContainerClassname?.includes(`mod-right`),
        viewModeOverride: enoughRoom ? (periodicData?.isPeriodic ? get(settingsStore).timeline.viewMode : get(settingsStore).timeline.restViewMode) : 'collapsed'
      },
    })
  }

  public isMountedIn(leaf: WorkspaceLeaf | null, remove: boolean = false) {
    if (!leaf) return;

    return Array.from(leaf.view.containerEl.children).find((el: HTMLElement) => {
      if (el.dataset?.type === TIMELINE_TYPE) {
        if (remove) {
          el.remove();
        }
        return true
      }
    });
  }

  public restart(leaf: WorkspaceLeaf, periodicData: { isPeriodic: boolean, granularity: IGranularity | null, date: moment.Moment | null } | null = null, file: TFile) {
    this.unmount(leaf)
    this.mount(leaf, periodicData, file)
  }
  public restartAll() {
    this.unmountAll();
    this.mountAll();
  }

  /**
    * unmount a timeline component from a specific leaf
  */
  public unmount(leaf: WorkspaceLeaf | null) {
    // we don't use unmount from svelte
    // since it's impossible AFAIK to identity a specific timeline component 
    if (!leaf) return;

    Array.from(leaf.view.containerEl.children).forEach((el: HTMLElement) => {
      if (el.dataset?.type === TIMELINE_TYPE) {
        el.remove();
      }
    });
  }

  public unmountAll() {
    for (const timeline of Object.values(TimelineManager.components)) {
      unmount(timeline);
    }
    TimelineManager.components = {};
  }

  public layoutSync() {
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
    const isPeriodicNote = typeof isValid === "boolean" && date && granularity

    if (isPeriodicNote) {
      this.restart(crrActiveLeaf, { isPeriodic: true, granularity, date }, activeFile);
      timelineParentFileStore.set(activeFile)

      if (
        PluginService.getPlugin()?.app.workspace.layoutReady
        && !ViewManager.isMainLeaf(crrActiveLeaf)
        && crrActiveLeaf?.view
        && crrActiveLeaf?.view instanceof FileView
        && !ViewManager.isPreviewLeaf(crrActiveLeaf)?.leaf
        && get(settingsStore).syncCalendar
      ) {
        displayedDateStore.set(date)
        const enabledPeriodsRes = getEnabledPeriods();
        if (enabledPeriodsRes.tabs.includes(granularity as typeof periodTabs[number])) {
          crrTabStore.set(granularity as typeof periodTabs[number])
        }
      }

      return;
    }

    if (!isPeriodicNote && get(settingsStore).timeline.displayOnRestNotes) {
      // restart timeline with today's date on non-periodic notes
      this.restart(crrActiveLeaf, null, activeFile);
      return;
    }

    if (!isPeriodicNote && this.isMountedIn(crrActiveLeaf)) {
      this.unmount(crrActiveLeaf);
      return;
    };
  }


  /**
    * only instantiates TimelineManager if enabled 
  */
  static create() {
    if (!TimelineManager.instance && get(settingsStore).timeline.enabled) {
      TimelineManager.instance = new TimelineManager()
    }
    return TimelineManager.instance
  }

  static destroy() {
    if (TimelineManager.instance) {
      TimelineManager.instance.unmountAll()
      TimelineManager.instance = null
    }
  }
}
