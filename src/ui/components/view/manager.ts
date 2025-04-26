import { LEAF_TYPE, PREVIEW_CONTROLS_TYPE } from '@/constants';
import { createNote, getFileData, IGranularity } from '@/io';
import { isValidPeriodicNote } from '@/io/validation';
import { PeriodSettings, settingsStore, type ISettings } from '@/settings';
import { activeFileStore, mainLeafStore, previewLeafStore, processingPreviewChangeStore } from '@/stores';
import { capitalize } from '@/utils';
import { MarkdownView, TFile, View, WorkspaceLeaf, Platform } from 'obsidian';
import { mount, unmount } from 'svelte';
import { get } from 'svelte/store';
import { PreviewControls } from '.';
import { goToNoteHeading } from './utils';
import TimelineManager from '../timeline/manager';
import { PluginService } from '@/app-service';
import { TSticker } from '@/ui/utils';

export class ViewManager {
    static previewControlsComponent: Record<string, any> | null;
    static previewTabHeaderEl: HTMLElement | null;
    static previewLeafCleanups: (() => void)[] = [];
    private static firstLayoutChange = true;

    static async initView({ active }: { active: boolean } = { active: true }) {
        let mainLeaf = this.getMainLeaf();

        if (!mainLeaf) {
            mainLeaf = PluginService.getPlugin()?.app.workspace.getRightLeaf(false) ?? null;
        }
        mainLeaf?.setViewState({
            type: LEAF_TYPE,
            active
        });

        if (mainLeaf && get(settingsStore).preview.enabled) {
            this.setupPreviewEvHandlers()
        } else {
            this.cleanupPreview();
        }

        return mainLeaf;
    }

    static async revealView(type: 'view' | 'preview' = 'view', workspaceLeaf?: WorkspaceLeaf, file?: TFile) {
        let leaf: WorkspaceLeaf | undefined | null = null;
        if (type === 'preview') {
            leaf = workspaceLeaf || get(previewLeafStore)?.leaf || this.searchPreviewLeaf();
            if (!leaf) {
                leaf = await this.initPreview(file)
            }

            if (leaf) {
                await PluginService.getPlugin()?.app.workspace.revealLeaf(leaf);
            }
        }
        if (type === 'view') {
            leaf = PluginService.getPlugin()?.app.workspace.getLeavesOfType(LEAF_TYPE)[0];
            if (!leaf) {
                leaf = await this.initView()
            }

            if (leaf) {
                await PluginService.getPlugin()?.app.workspace.revealLeaf(leaf);
                await leaf.setViewState({
                    type: LEAF_TYPE,
                    active: true
                });
            }
        }
    }

    private static setupVisibilityTracking(): () => void {
        // Register event handlers
        const boundCb = this.handleLayoutChange.bind(this);
        PluginService.getPlugin()?.app.workspace.on('resize', boundCb);

        // Return cleanup function
        return () => {
            PluginService.getPlugin()?.app.workspace.off('resize', boundCb);
        };
    }

    /**
        * map layout changes and react to changes in the workspace
    */
    static async handleLayoutChange() {
        const prevMainLeaf = get(mainLeafStore)
        const prevPreviewLeaf = get(previewLeafStore);

        // crr active leaf
        const crrActiveLeaf = PluginService.getPlugin()?.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;

        // main leaf
        const mainLeaf = this.getMainLeaf() as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number } | null;
        const mainLeafvisible = mainLeaf && this.isLeafVisible(mainLeaf)
        const isMainLeafReopened = !prevMainLeaf?.visible && mainLeafvisible;
        const mainLeafSplitPos = mainLeaf && this.getLeafSplitPosition(mainLeaf);
        const mainLeafView = (mainLeaf?.view as View & { contentEl: { children: HTMLElement[] } | null } | null);
        const mainLeafHeight = Array.from(mainLeafView?.contentEl?.children || []).find(c => c.id.includes('pnc-container'))?.clientHeight ?? 0;
        const mainLeafParentHeight = ((mainLeaf?.parent as any)?.containerEl?.clientHeight as number | undefined) ?? 0;

        mainLeafStore.update(s => ({
            ...s,
            leaf: mainLeaf,
            visible: mainLeafvisible,
            reopened: isMainLeafReopened,
            splitPos: mainLeafSplitPos ?? s?.splitPos ?? null,
        }))

        // preview leaf
        const previewLeaf = this.searchPreviewLeaf()
        const previewLeafVisible = previewLeaf && this.isLeafVisible(previewLeaf)
        const isPreviewMaximized = (previewLeaf && this.checkIfPreviewIsMaximized(previewLeaf)) || null;
        const previewSplitPosition = previewLeaf && this.getLeafSplitPosition(previewLeaf);
        const previewSplitDirection = previewLeaf && this.getPreviewSplitDirection(previewLeaf);
        // leaf.view.state.file will be used when markdown view is not visible and leaf.view.file.path would return undefined
        // this value is undefined when markdown view is visible
        const previewFilepath = (previewLeaf?.view as any)?.state?.file as string | undefined || (previewLeaf?.view as any)?.file?.path as string | null
        const previewFile = (previewFilepath ? PluginService.getPlugin()?.app.vault.getAbstractFileByPath(previewFilepath) : null)
        let isOpenPreviewBttnVisible =
            get(settingsStore).preview.enabled
            && (
                !previewLeafVisible
                || isPreviewMaximized
                || (mainLeafSplitPos !== previewSplitPosition)
                || (this.firstLayoutChange ? false : ((previewLeaf as any)?.id !== (prevPreviewLeaf?.leaf as any)?.id))
            )

        // hide open preview button when there is not enough room for it, should only work on desktop and tablets, phones do not have enough space
        const isMoreThanOneSplitleaf = Array.from((mainLeaf?.parent?.parent as any)?.children || [])?.length > 1
        if (!Platform.isPhone && !previewLeafVisible && isMoreThanOneSplitleaf && (mainLeafHeight + 100 >= mainLeafParentHeight)) {
            isOpenPreviewBttnVisible = false
        }

        if (this.firstLayoutChange && previewLeaf && previewFile && previewFile instanceof TFile) {
            const { granularity } = await this.getPreviewFileData();
            // setup existing preview leaf with preview controls and all stuff required to make a preview leaf
            this.setupOpenPreviewLeaf({
                file: previewFile,
                granularity,
                previewLeaf,
                openFile: false,
            })
        }

        previewLeafStore.update(s => ({
            ...s,
            leaf: previewLeaf,
            filepath: previewFilepath,
            visible: previewLeafVisible,
            maximized: isPreviewMaximized,
            splitPos: previewSplitPosition ?? s?.splitPos ?? null,
            splitDir: previewSplitDirection ?? s?.splitDir ?? null,
            isOpenBttnVisible: isOpenPreviewBttnVisible
        }))
        // update lastPreview to ensure next check in cleanup will correctly recognize the new file preview that leaf is showing
        // console.log("💖💖💖💖💖💖💖 lastPreview update 💖💖💖💖💖💖💖 ")
        // console.table({
        //     previewLeaf,
        //     previewFilepath,
        //     lastPreview: get(settingsStore).preview.lastPreview,
        //     check: (previewFilepath !== get(settingsStore).preview.lastPreview?.filepath)
        // })
        if (
            previewLeaf
            && previewFilepath
            && (
                previewFilepath !== get(settingsStore).preview.lastPreview?.filepath
                || previewSplitPosition !== get(settingsStore).preview.lastPreview?.splitPos
            )
        ) {
            settingsStore.update(s => ({
                ...s,
                preview: {
                    ...s.preview,
                    lastPreview: {
                        filepath: previewFilepath,
                        splitPos: previewSplitPosition,
                    }
                }
            }))
        }

        // console.log("💖💖💖💖💖💖💖 layout change 💖💖💖💖💖💖💖 ");
        // console.table({
        //     // active leaf
        //     crrActiveLeaf,
        //     crrActiveLeafId: (crrActiveLeaf as any)?.id,
        //     // main leaf
        //     mainLeafStore: get(mainLeafStore),
        //     mainLeafHeight,
        //     mainLeafParentHeight,
        //     mainLeafHeightComparison: mainLeafHeight > mainLeafParentHeight,
        //     // preview leaf
        //     previewLeafStore: get(previewLeafStore),
        //     previewSettings: get(settingsStore).preview,
        //     previewFile,
        //     prevPreviewLeaf: prevPreviewLeaf?.leaf,
        //     prevPreviewLeafId: ((prevPreviewLeaf)?.leaf as any)?.id,
        //     processingPreviewChange: get(processingPreviewChangeStore),
        //     firstLayoutChange: this.firstLayoutChange,
        // })

        if (this.firstLayoutChange) {
            this.firstLayoutChange = false;
        }

        // avoid toggling preview if it has transitioned to an expanded-like state (moved to another tab)
        // if (isPreviewMaximized) {
        //     processingPreviewChangeStore.set(false);
        // };

        if (!get(processingPreviewChangeStore)) {
            const previewMaximized =
                !get(settingsStore).preview.splitMode
                || get(previewLeafStore)?.maximized


            // TIMELINE
            // remount preview's timeline when no longer in left or right side
            const prevPreviewIsSide = prevPreviewLeaf?.splitPos === 'left' || prevPreviewLeaf?.splitPos === 'right'
            const crrPrevIsSide = previewSplitPosition === 'left' || previewSplitPosition === 'right'
            const previewMovedFromSideToRoot = prevPreviewLeaf && previewLeaf && prevPreviewIsSide && !crrPrevIsSide
            const previewMovedFromRootToSide = prevPreviewLeaf && previewLeaf && !prevPreviewIsSide && crrPrevIsSide
            if (previewMovedFromSideToRoot || previewMovedFromRootToSide) {
                TimelineManager.cleanup(previewLeaf)
                TimelineManager.tryMount(previewLeaf)
            }
            TimelineManager.handleLayoutChange()

            // PREVIEWLEAF
            // very especific check for when an expanded preview panel is moved to a split window
            if (previewLeafVisible && (!get(settingsStore).preview.splitMode && !isPreviewMaximized)) {
                settingsStore.update(s => {
                    s.preview.tabHeaderVisible = true;
                    return s;
                })
                return;
            }
            // show preview when user moves back to calendar tab and preview is open
            if (!prevPreviewLeaf?.leaf && !previewLeaf && isMainLeafReopened && get(settingsStore).preview.enabled && get(settingsStore).preview.open && !previewMaximized) {
                // console.log("🌳 initPreview")
                this.initPreview();
                processingPreviewChangeStore.set(true);
                return;
            }

            // CLEANUPS

            // avoids closing preview when preview leaf shows a different file
            if (!this.firstLayoutChange && ((crrActiveLeaf as any)?.id === ((prevPreviewLeaf)?.leaf as any)?.id)) {
                return
            }

            // cleanup preview when user closes calendar tab
            if (prevMainLeaf?.leaf && !mainLeaf) {
                this.cleanupPreviews()
                processingPreviewChangeStore.set(true);
                // console.log("❌ mainLeaf not found and removed preview")
                return;
            }
            if (prevPreviewLeaf?.leaf && !previewLeaf) {
                this.cleanupPreview();
                processingPreviewChangeStore.set(true);
                // console.log("❌ previewLeaf not found, removed and set open to false")
                !this.firstLayoutChange && settingsStore.update(s => {
                    s.preview.open = false
                    return s
                })
                return;
            }
            // moved preview split out of calendar view to a different tab, should close preview leaf
            if (previewLeaf && previewLeafVisible && !mainLeafvisible && get(settingsStore).preview.splitMode && !previewMaximized) {
                this.cleanupPreview({ leaf: previewLeaf });
                processingPreviewChangeStore.set(true);
                // console.log("❌ moved out of calendar view to a different tab, removed preview")
                return;
            }
        } else {
            processingPreviewChangeStore.set(false);
        }
    }


    private static isLeafVisible(leaf: WorkspaceLeaf): boolean {
        const _leaf = leaf as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number };
        const display = _leaf.containerEl.style.display;
        // Check if the leaf is in the DOM and visible
        return (
            display !== 'none' &&
            _leaf.width > 0 &&
            _leaf.height > 0
        );
    }
    /**
     * The worskpace split where leaf is currently attached to
     * based on closest `.workspace-split` className
     */
    static getLeafSplitPosition(workspaceLeaf: WorkspaceLeaf | null) {
        const leaf = workspaceLeaf as WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement } | null
        if (!leaf) return null;

        const closestWorkspaceClassname = Platform.isPhone ? ".workspace-drawer" : ".workspace-split"
        const closestWorkspaceSplitClassName =
            leaf?.containerEl.closest(closestWorkspaceClassname)?.className;

        if (closestWorkspaceSplitClassName?.includes('left')) {
            return 'left';
        }

        if (closestWorkspaceSplitClassName?.includes('right')) {
            return 'right';
        }

        return 'root';
    }

    static restartPreview(defaultFile?: TFile, reveal?: boolean, overrideSplitDirection?: 'vertical' | 'horizontal') {
        this.cleanupPreview();
        this.initPreview(defaultFile, reveal, overrideSplitDirection);
    }

    static async tryInitPreview(defaultFile?: TFile, reveal?: boolean) {
        const previewLeaf = get(previewLeafStore)?.leaf || this.searchPreviewLeaf();
        if (!previewLeaf) {
            this.initPreview(defaultFile, reveal)
        } else {
            const data = await this.getPreviewFileData()
            const file = defaultFile || data.file
            if (file) {
                this.setupOpenPreviewLeaf({
                    file,
                    granularity: data.granularity,
                    date: data.date,
                    previewLeaf
                })
            }
            reveal && this.revealView('preview', previewLeaf);
        }
    }
    static async initPreview(defaultFile?: TFile, reveal?: boolean, overrideSplitDirection?: 'vertical' | 'horizontal') {
        const data = await this.getPreviewFileData();
        const file = defaultFile || data.file;
        const mainLeaf = this.getMainLeaf();
        let previewLeaf: WorkspaceLeaf | null = null;
        const viewLeafPosition = this.getLeafSplitPosition(mainLeaf);

        if (file && mainLeaf) {
            const splitDirection =
                overrideSplitDirection
                || (viewLeafPosition === 'root'
                    ? get(settingsStore).preview.centerSplitDirection
                    : get(settingsStore).preview.sideSplitDirection)
            const splitMode = !!overrideSplitDirection || get(settingsStore).preview.splitMode;

            if (splitMode) {
                const mainLeafParent = mainLeaf?.parent?.parent;
                const mainLeafSplitParentChildren = Array.from((mainLeafParent as any)?.children || []) as WorkspaceLeaf[]
                if (mainLeafSplitParentChildren.length > 1) {
                    // there is a split leaf sibling, use it
                    const previewLeafParent = mainLeafSplitParentChildren.find((leaf) => (leaf as any).containerEl !== (mainLeaf as any).containerEl.closest(".workspace-tabs"))
                    let previewLeafParentChildren = Array.from((previewLeafParent as any)?.children || []) as WorkspaceLeaf[]

                    previewLeaf = PluginService.getPlugin()?.app.workspace.createLeafInParent(previewLeafParent as WorkspaceLeaf, previewLeafParentChildren.length) ?? null
                } else {
                    previewLeaf = PluginService.getPlugin()?.app.workspace.createLeafBySplit(mainLeaf, splitDirection) ?? null;
                }
            } else {
                if (viewLeafPosition) {
                    if (viewLeafPosition === 'root') {
                        // previewLeaf = PluginService.getPlugin()?.app.workspace.getLeaf('tab') ?? null
                        previewLeaf = PluginService.getPlugin()?.app.workspace.getLeaf(false) ?? null;
                    } else {
                        previewLeaf = PluginService.getPlugin()?.app.workspace[`get${capitalize(viewLeafPosition) as "Left" | "Right"}Leaf`](false) ?? null;
                    }
                }
            }

            if (previewLeaf) {
                reveal && this.revealView('preview', previewLeaf);
                this.setupOpenPreviewLeaf({
                    file,
                    granularity: data.granularity,
                    date: data.date,
                    previewLeaf
                })
            }
        }

        return previewLeaf;
    }

    static checkIfPreviewIsMaximized(previewLeaf: WorkspaceLeaf | null) {
        const tabHeaderLeaves = (previewLeaf?.parent as any)?.children as WorkspaceLeaf[] | undefined;
        const leaf = previewLeaf as WorkspaceLeaf & { containerEl: HTMLElement };
        let previewIsOnlyWorkspaceLeaf = true;
        let previewIsCalendarLeafSibling = false;

        const closestWorkspaceClassname = Platform.isPhone ? ".workspace-drawer" : ".workspace-split"
        const children = leaf?.containerEl?.closest(closestWorkspaceClassname)?.children || null
        const tabs = Array.from(children || []).filter((el: HTMLElement) => {
            if (el.className.includes('workspace-tabs')) {
                return el
            }
        })
        if (tabs.length > 1) {
            previewIsOnlyWorkspaceLeaf = false
        }
        if (tabHeaderLeaves) {
            for (let i = 0; i < tabHeaderLeaves.length; i++) {
                if (previewIsCalendarLeafSibling) break;

                const leaf = tabHeaderLeaves[i] as WorkspaceLeaf & { containerEl: HTMLElement };
                const childNodes = leaf?.containerEl?.childNodes as unknown as HTMLElement[]
                for (let j = 0; j < childNodes.length; j++) {
                    const el = childNodes[j];
                    if (el.dataset.type === LEAF_TYPE) {
                        previewIsCalendarLeafSibling = true
                        break;
                    }
                }
            }
        }
        return ((tabs.length > 0 && previewIsOnlyWorkspaceLeaf) || previewIsCalendarLeafSibling)
    }
    static getPreviewSplitDirection(previewLeaf: WorkspaceLeaf | null) {
        return ((previewLeaf?.parent?.parent as any)?.direction || null) as 'vertical' | 'horizontal' | null;
    }
    static cleanupPreview({ leaf }: { leaf?: WorkspaceLeaf } = {}) {
        const previewLeaf = leaf || this.searchPreviewLeaf() || get(previewLeafStore)?.leaf
        previewLeaf?.detach();
        this.cleanupPreviewControls()
        const isOpenBttnVisible = get(previewLeafStore)?.isOpenBttnVisible
        previewLeafStore.set(null);
        previewLeafStore.set({
            leaf: null,
            isOpenBttnVisible
        })
        this.previewTabHeaderEl = null

        settingsStore.update(s => {
            s.preview.lastPreview = null
            return s
        })
    }
    static cleanupPreviewControls() {
        this.previewControlsComponent && unmount(this.previewControlsComponent)
        this.previewControlsComponent = null;
    }
    static cleanupPreviews() {
        PluginService.getPlugin()?.app.workspace.iterateAllLeaves((leaf) => {
            const isPreview = this.isPreviewLeaf(leaf)
            if (isPreview?.leaf) {
                this.cleanupPreview({ leaf: isPreview.leaf })
            }
        })
    }

    static getMainLeaf() {
        return PluginService.getPlugin()?.app.workspace.getLeavesOfType(LEAF_TYPE)[0] as WorkspaceLeaf | null
    }
    static isMainLeaf(leaf: WorkspaceLeaf | null) {
        return leaf === this.getMainLeaf()
    }
    /**
        * It should always traverse the entire workspace to find the most up-to-date preview leaf.
        * Accessing previewLeafStore.leaf should be done before calling this method if needed
    */
    static searchPreviewLeaf(file?: TFile) {
        let previewLeafFound = false;
        let previewLeaf: WorkspaceLeaf | null = null;
        PluginService.getPlugin()?.app.workspace.iterateAllLeaves((leaf) => {
            // on first layout change, preview controls arent mounted so we need to check
            // for whether the leaf is in its default position
            if (previewLeafFound) return;

            if (get(previewLeafStore)?.leaf === leaf && (get(previewLeafStore) as any)?.view?.file === (leaf?.view as any)?.file) {
                previewLeaf = leaf
                previewLeafFound = true

                return;
            }
            const isPreview = this.isPreviewLeaf(leaf, file)
            if (isPreview?.leaf) {
                previewLeaf = isPreview.leaf
                previewLeafFound = true
            }
        })
        return previewLeaf as WorkspaceLeaf | null;
    }
    static isPreviewLeaf(leaf: WorkspaceLeaf | null, file: TFile | null = null) {
        if (get(previewLeafStore)?.leaf === leaf) {
            return { leaf }
        }

        const lastPreview = get(settingsStore).preview.lastPreview;
        const leafSplitPos = this.getLeafSplitPosition(leaf);
        const leafView = leaf?.view as MarkdownView & { state: { file: string } };
        const isLeafViewMarkdown = leaf?.getViewState().type === 'markdown'
        const isLeafCalendar = leafView?.containerEl?.dataset?.type === LEAF_TYPE
        const hasPreviewControls = (
            this.firstLayoutChange
            || Array.from(leafView?.containerEl.childNodes)
                .find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE))
        /** leaf.view.state.file will be used when markdown view is not visible and leaf.view.file.path would return undefined
        * this value is undefined when markdown view is visible
        */
        const leafFilepath = file?.path || leafView?.state?.file as string | undefined || (leaf?.view as any).file?.path as string | undefined;

        if (!leaf || !isLeafViewMarkdown || isLeafCalendar || !hasPreviewControls) return;
        if (leafFilepath !== lastPreview?.filepath || leafSplitPos !== lastPreview?.splitPos) return;

        return { leaf }
    }

    static togglePreviewTabHeader(leaf?: WorkspaceLeaf) {
        const previewLeaf = leaf || get(previewLeafStore)?.leaf || this.searchPreviewLeaf();
        this.previewTabHeaderEl = (previewLeaf?.parent as any)?.tabHeaderContainerEl as HTMLElement | null

        if (this.previewTabHeaderEl && !this.checkIfPreviewIsMaximized(previewLeaf) && this.getLeafSplitPosition(previewLeaf) !== 'root') {
            if (!get(settingsStore).preview.tabHeaderVisible) {
                this.previewTabHeaderEl.id = "pnc-preview-tabheader-hidden"
            } else {
                this.previewTabHeaderEl.id = "pnc-preview-tabheader-visible"
            }
        }
    }

    static async getPreviewFileData() {
        let file: TFile | null = null;
        let sticker: TSticker | null = null;
        let granularity: IGranularity | null = null;
        let date: moment.Moment = window.moment();
        let createNewFile = false;
        Object.entries(get(settingsStore).periods).forEach(async (entry) => {
            const [g, s] = entry as [IGranularity, PeriodSettings];
            if (s.enabled) {
                const crrGranularity = get(settingsStore).preview.crrGranularity
                if (!file && (crrGranularity === g || crrGranularity === null)) {
                    if (crrGranularity === null) {
                        settingsStore.update(s => {
                            s.preview.crrGranularity = g
                            return s
                        })
                    }
                    const fileData = getFileData(g, date);
                    if (!fileData.file) {
                        createNewFile = true
                    } else {
                        file = fileData.file
                        sticker = fileData.sticker
                    }
                    granularity = g
                }
            }
        })

        if (createNewFile && granularity) {
            file = await createNote(granularity, date) ?? null;
        }

        return {
            file,
            sticker: sticker as TSticker | null,
            granularity: granularity as unknown as IGranularity,
            date
        };
    }
    static async setupOpenPreviewLeaf({
        file,
        granularity,
        date,
        previewLeaf,
        openFile = true,
    }: {
        file: TFile;
        granularity: IGranularity;
        date?: moment.Moment | null;
        previewLeaf: WorkspaceLeaf;
        openFile?: boolean;
    }) {
        openFile && await previewLeaf.openFile(file);
        previewLeafStore.update((s) => ({
            ...s,
            leaf: previewLeaf,
            filepath: file.path
        }));
        settingsStore.update(s => {
            s.preview.open = true
            s.preview.lastPreview = {
                ...s.preview.lastPreview,
                filepath: file.path
            }
            return s
        });
        activeFileStore.update(d => {
            if (d) {
                d.file = file
            }
            return d
        })

        this.togglePreviewTabHeader(previewLeaf)

        goToNoteHeading({
            heading: get(settingsStore).periods[granularity].preview.mainSection
        })

        // add overlay control buttons
        const previewControlsExists = Array.from(previewLeaf.view.containerEl.childNodes).find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE)
        if (!this.previewControlsComponent || !previewControlsExists) {
            this.previewControlsComponent = mount(PreviewControls, {
                target: previewLeaf.view.containerEl,
                props: {
                    date: date || isValidPeriodicNote(file.basename, [granularity]).date,
                }
            })
        }
    }

    static setupPreviewEvHandlers() {
        const cleanup = this.setupVisibilityTracking();
        this.previewLeafCleanups.push(cleanup);
    }
    static cleaunupPreviewEvHandlers() {
        this.previewLeafCleanups.length > 0 && this.previewLeafCleanups.forEach((cleanup) => cleanup());
        this.previewLeafCleanups = [];
    }

    static getFileFromLeaf(leaf?: WorkspaceLeaf | null, _file?: TFile) {
        if (!leaf) return;

        const leafView = leaf.view as MarkdownView & { state: { file: string } };
        const leafFilepath = _file?.path || leafView?.state?.file as string | undefined || (leaf?.view as any).file?.path as string | undefined;
        if (!leafFilepath) return;

        const file = PluginService.getPlugin()?.app.vault.getAbstractFileByPath(leafFilepath);
        if (file && !(file instanceof TFile)) return;
        if (!file) return;

        return file
    }
}
