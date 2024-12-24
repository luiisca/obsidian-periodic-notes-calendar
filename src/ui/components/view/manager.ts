import { LEAF_TYPE, PREVIEW_CONTROLS_TYPE } from '@/constants';
import { createNote, getFileData, IGranularity } from '@/io';
import { isValidPeriodicNote } from '@/io/validation';
import { PeriodSettings, settingsStore, type ISettings } from '@/settings';
import { activeFileStore, mainLeafStore, previewLeafStore, processingPreviewChangeStore } from '@/stores';
import { capitalize, isMobile, isPhone, isTablet } from '@/utils';
import moment, { Moment } from 'moment';
import { MarkdownView, TFile, View, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import { get } from 'svelte/store';
import { PreviewControls } from '.';
import { goToNoteHeading } from './utils';
import TimelineManager from '../timeline/manager';

export class ViewManager {
    static previewControlsComponent: Record<string, any> | null;
    static previewTabHeaderEl: HTMLElement | null;
    static previewLeafCleanups: (() => void)[] = [];
    private static firstLayoutChange = true;

    static async initView({ active }: { active: boolean } = { active: true }) {
        window.app.workspace.detachLeavesOfType(LEAF_TYPE);
        let mainLeaf;

        const leafPosition = get(settingsStore).viewLeafPosition as ISettings["viewLeafPosition"];
        if (leafPosition === 'root') {
            mainLeaf = window.app.workspace.getLeaf('tab')
            mainLeaf?.setViewState({
                type: LEAF_TYPE,
                active
            })
        } else {
            mainLeaf = window.app.workspace[`get${capitalize(leafPosition) as "Left" | "Right"}Leaf`](false);
            mainLeaf?.setViewState({
                type: LEAF_TYPE,
                active
            });
        }

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
                await window.app.workspace.revealLeaf(leaf);
            }
        }
        if (type === 'view') {
            leaf = window.app.workspace.getLeavesOfType(LEAF_TYPE)[0];
            if (!leaf) {
                leaf = await this.initView()
            }

            if (leaf) {
                await window.app.workspace.revealLeaf(leaf);
                await leaf.setViewState({
                    type: LEAF_TYPE,
                    active: true
                });
            }
        }
    }

    private static setupVisibilityTracking(): () => void {
        // Handler for layout changes
        const handleLayoutChange = async () => {
            const prevMainLeaf = get(mainLeafStore)
            const prevPreviewLeaf = get(previewLeafStore);

            // crr active leaf
            const crrActiveLeaf = window.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;

            // main leaf
            const mainLeaf = this.getMainLeaf() as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number } | null;
            const mainLeafvisible = mainLeaf && this.isLeafVisible(mainLeaf)
            const isMainLeafReopened = !prevMainLeaf?.visible && mainLeafvisible;
            const mainLeafSplitPos = mainLeaf && this.getLeafSplitPosition(mainLeaf);

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
            let isOpenPreviewBttnVisible =
                get(settingsStore).preview.enabled
                && (
                    !previewLeafVisible
                    || isPreviewMaximized
                    || (mainLeafSplitPos !== previewSplitPosition)
                    || ((previewLeaf as any)?.id !== (prevPreviewLeaf?.leaf as any)?.id)
                )
            const mainLeafView = (mainLeaf?.view as View & { contentEl: { children: HTMLElement[] } } | null);
            const mainLeafHeight = Array.from(mainLeafView?.contentEl.children || []).find(c => c.id.includes('pnc-container'))?.clientHeight ?? 0;
            const mainLeafParentHeight = ((mainLeaf?.parent as any)?.containerEl?.clientHeight as number | undefined) ?? 0;

            // hide open preview button when there is not enough room for it, should only work on desktop and tablets, phones do not have enough space
            const isMoreThanOneSplitleaf = Array.from((mainLeaf?.parent?.parent as any)?.children || [])?.length > 1
            if (!isPhone() && !previewLeafVisible && isMoreThanOneSplitleaf && (mainLeafHeight + 100 >= mainLeafParentHeight)) {
                isOpenPreviewBttnVisible = false
            }

            // leaf.view.state.file will be used when markdown view is not visible and leaf.view.file.path would return undefined
            // this value is undefined when markdown view is visible
            const previewFilepath = (previewLeaf?.view as any)?.state?.file as string | undefined || (previewLeaf?.view as any)?.file?.path as string | null
            const previewFile = previewFilepath ? window.app.vault.getAbstractFileByPath(previewFilepath) : null
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
                console.log("🙌 layout change, about to perform preview change checks")

                const previewMaximized =
                    get(settingsStore).preview.defaultExpansionMode === "maximized"
                    || get(previewLeafStore)?.maximized


                // add or remove timeline
                this.addOrRemoveTimeline()

                // very especific check for when an expanded preview window is moved to a split window
                if (previewLeafVisible && (get(settingsStore).preview.defaultExpansionMode === "maximized" && !isPreviewMaximized)) {
                    settingsStore.update(s => {
                        s.preview.tabHeaderVisible = true;
                        return s;
                    })
                    return;
                }
                // show preview when user moves back to calendar tab and preview is open
                if (!prevPreviewLeaf?.leaf && !previewLeaf && isMainLeafReopened && get(settingsStore).preview.enabled && get(settingsStore).preview.open && !previewMaximized) {
                    console.log("🌳 initPreview")
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
                    console.log("❌ mainLeaf not found and removed preview")
                    return;
                }
                if (prevPreviewLeaf?.leaf && !previewLeaf) {
                    this.cleanupPreview();
                    processingPreviewChangeStore.set(true);
                    console.log("❌ previewLeaf not found, removed and set open to false")
                    !this.firstLayoutChange && settingsStore.update(s => {
                        s.preview.open = false
                        return s
                    })
                    return;
                }
                // moved out of calendar view to a different tab
                if (previewLeaf && previewLeafVisible && !mainLeafvisible && previewSplitPosition === get(settingsStore).viewLeafPosition && !previewMaximized) {
                    this.cleanupPreview({ leaf: previewLeaf });
                    processingPreviewChangeStore.set(true);
                    console.log("❌ moved out of calendar view to a different tab, removed preview")
                    return;
                }
            } else {
                processingPreviewChangeStore.set(false);
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
    static restartPreview(defaultFile?: TFile, reveal?: boolean) {
        this.cleanupPreview();
        this.initPreview(defaultFile, reveal);
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
    static async initPreview(defaultFile?: TFile, reveal?: boolean) {
        const data = await this.getPreviewFileData();
        const file = defaultFile || data.file;
        const mainLeaf = this.getMainLeaf();
        let previewLeaf: WorkspaceLeaf | null = null;

        if (file && mainLeaf) {
            const viewLeafPosition = get(settingsStore).viewLeafPosition
            const splitMode = viewLeafPosition === 'root' ? get(settingsStore).preview.centerDefaultSplitMode : get(settingsStore).preview.defaultSplitMode
            const expandMode = get(settingsStore).preview.defaultExpansionMode;

            if (expandMode === 'maximized') {
                if (viewLeafPosition === 'root') {
                    previewLeaf = window.app.workspace.getLeaf('tab')
                } else {
                    previewLeaf = window.app.workspace[`get${capitalize(viewLeafPosition) as "Left" | "Right"}Leaf`](false);
                }
            } else {
                const mainLeafParent = mainLeaf?.parent?.parent;
                const mainLeafSplitParentChildren = Array.from((mainLeafParent as any)?.children || []) as WorkspaceLeaf[]
                if (mainLeafSplitParentChildren.length > 1) {
                    // there is a split leaf sibling, use it
                    const previewLeafParent = mainLeafSplitParentChildren.find((leaf) => (leaf as any).containerEl !== (mainLeaf as any).containerEl.closest(".workspace-tabs"))
                    let previewLeafParentChildren = Array.from((previewLeafParent as any)?.children || []) as WorkspaceLeaf[]

                    previewLeaf = window.app.workspace.createLeafInParent(previewLeafParent as WorkspaceLeaf, previewLeafParentChildren.length)
                } else {
                    previewLeaf = window.app.workspace.createLeafBySplit(mainLeaf, splitMode);
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

        const closestWorkspaceClassname = isMobile() ? ".workspace-drawer" : ".workspace-split"
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
    /**
     * The worskpace split where leaf is currently attached to
     * based on closest `.workspace-split` className
     */
    static getLeafSplitPosition(workspaceLeaf: WorkspaceLeaf | null) {
        const leaf = workspaceLeaf as WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement } | null
        if (!leaf) return null;

        const closestWorkspaceClassname = isMobile() ? ".workspace-drawer" : ".workspace-split"
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
        window.app.workspace.iterateAllLeaves((leaf) => {
            const isPreview = this.isPreviewLeaf(leaf)
            if (isPreview?.leaf) {
                this.cleanupPreview({ leaf: isPreview.leaf })
            }
        })
    }

    static getMainLeaf() {
        return window.app.workspace.getLeavesOfType(LEAF_TYPE)[0] as WorkspaceLeaf | null
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
        window.app.workspace.iterateAllLeaves((leaf) => {
            // on first layout change, preview controls arent mounted so we need to check
            // for whether the leaf is in its default position
            if (previewLeafFound) return;

            if (get(previewLeafStore)?.leaf === leaf && (get(previewLeafStore) as any)?.view?.file === (leaf?.view as any)?.file) {
                // console.log("👑🌿🌿🌿 searchPreviewLeaf() 🌿🌿🌿🌿", leaf, "preview found is the same as the one in store!")
                previewLeaf = leaf
                previewLeafFound = true

                return;
            }
            const isPreview = this.isPreviewLeaf(leaf, file)
            if (isPreview?.leaf) {
                // console.log("💰🌿🌿🌿 searchPreviewLeaf() 🌿🌿🌿🌿", isPreview.leaf, "preview found!")
                previewLeaf = isPreview.leaf
                previewLeafFound = true
            }
        })
        return previewLeaf as WorkspaceLeaf | null;
    }
    static isPreviewLeaf(leaf: WorkspaceLeaf | null, file: TFile | null = null) {
        // console.log("🌿🌿🌿🌿 isPreviewLeaf() 🌿🌿🌿🌿")
        // console.table({
        //     leaf,
        //     leafSplitPos: this.getLeafSplitPosition(leaf),
        //     firstLayoutChange: this.firstLayoutChange,
        //     containsPreviewControls: leaf && Array.from(leaf.view.containerEl.childNodes).find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE),
        //     leafFilepath: file?.path || (leaf && (file?.path || (leaf.view as any)?.state?.file as string | undefined || (leaf.view as any).file?.path as string | undefined)),
        //     lastPreview: get(settingsStore).preview.lastPreview,
        // })

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

        // console.log("🌿🌿🌿🌿 isPreviewLeaf() > found 🌿🌿🌿🌿", leaf, leafFilepath, lastPreview)
        return { leaf }
    }

    static togglePreviewTabHeader(leaf?: WorkspaceLeaf) {
        const previewLeaf = leaf || get(previewLeafStore)?.leaf || this.searchPreviewLeaf();
        this.previewTabHeaderEl = (previewLeaf?.parent as any)?.tabHeaderContainerEl as HTMLElement | null

        if (this.previewTabHeaderEl && !this.checkIfPreviewIsMaximized(previewLeaf) && this.getLeafSplitPosition(previewLeaf) !== 'root') {
            if (!get(settingsStore).preview.tabHeaderVisible) {
                this.previewTabHeaderEl.style.display = 'none'
            } else {
                this.previewTabHeaderEl.style.display = 'flex'
            }
        }
    }

    static async getPreviewFileData() {
        let file: TFile | null = null;
        let granularity: IGranularity | null = null;
        let date: Moment = moment();
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
                    const foundFile = getFileData(g, date).file;
                    if (!foundFile) {
                        createNewFile = true
                    } else {
                        file = foundFile
                    }
                    granularity = g
                }
            }
        })

        if (createNewFile && granularity) {
            file = await createNote(granularity, date);
        }

        return {
            file: file as TFile,
            granularity: granularity as unknown as IGranularity,
            date
        };
    }
    static async setupOpenPreviewLeaf({
        file,
        granularity,
        date,
        previewLeaf
    }: {
        file: TFile;
        granularity: IGranularity;
        date: Moment | null;
        previewLeaf: WorkspaceLeaf
    }) {
        await previewLeaf.openFile(file);
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

    static addOrRemoveTimeline() {
        const crrActiveLeaf = window.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
        if (!crrActiveLeaf) return;

        if (get(settingsStore).timeline.enabled) {
            if (!TimelineManager.isMounted(crrActiveLeaf)) {
                // mount timeline
                TimelineManager.tryMountTimeline(crrActiveLeaf);
            }
        } else {
            if (TimelineManager.isMounted(crrActiveLeaf)) {
                // unmount timeline
                TimelineManager.cleanup(crrActiveLeaf);
            }
        }
    }

    static getFileFromLeaf(leaf?: WorkspaceLeaf | null, _file?: TFile) {
        if (!leaf) return;

        const leafView = leaf.view as MarkdownView & { state: { file: string } };
        const leafFilepath = _file?.path || leafView?.state?.file as string | undefined || (leaf?.view as any).file?.path as string | undefined;
        if (!leafFilepath) return;

        const file = window.app.vault.getAbstractFileByPath(leafFilepath) as TFile | null;
        if (!file) return;

        return file
    }

    static unload() {
        window.app.workspace.detachLeavesOfType(LEAF_TYPE);
        this.cleanupPreview();
        this.cleaunupPreviewEvHandlers()
    }
}
