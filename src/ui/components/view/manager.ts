import { LEAF_TYPE, PREVIEW_CONTROLS_TYPE } from '@/constants';
import { createNote, getFileData, IGranularity } from '@/io';
import { isValidPeriodicNote } from '@/io/validation';
import { PeriodSettings, settingsStore, type ISettings } from '@/settings';
import { activeFilepathStore, displayedDateStore, isMainLeafReopenedStore, isMainViewVisibleStore, isOpenPreviewBttnVisibleStore, isPreviewMaximizedStore, isPreviewVisibleStore, mainViewLeafStore, previewLeafStore, previewSplitDirectionStore, previewSplitPositionStore, processingPreviewChangeStore } from '@/stores';
import { crrTabStore, getEnabledPeriods, periodTabs } from '@/stores/calendar';
import { capitalize } from '@/utils';
import moment, { Moment } from 'moment';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import { get } from 'svelte/store';
import { PreviewControls } from '.';
import { goToNoteHeading } from './utils';

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
            const cleanup = this.setupVisibilityTracking();
            this.previewLeafCleanups.push(cleanup);
        } else {
            this.cleanupPreview();
        }

        return mainLeaf;
    }

    static async revealView(type: 'view' | 'preview' = 'view', workspaceLeaf?: WorkspaceLeaf) {
        let leaf: WorkspaceLeaf | undefined | null = null;
        if (type === 'preview') {
            leaf = workspaceLeaf || get(previewLeafStore)?.leaf || this.searchPreviewLeaf();
            if (leaf) {
                window.app.workspace.revealLeaf(leaf);
            }
        }
        if (type === 'view') {
            leaf = window.app.workspace.getLeavesOfType(LEAF_TYPE)[0];
            if (!leaf) {
                leaf = await this.initView()
            }

            if (leaf) {
                window.app.workspace.revealLeaf(leaf);
                leaf.setViewState({
                    type: LEAF_TYPE,
                    active: true
                });
            }
        }
    }

    private static setupVisibilityTracking(): () => void {
        // Handler for layout changes
        const handleLayoutChange = async () => {
            const prevMainLeaf = get(mainViewLeafStore)
            const prevMainViewVisible = get(isMainViewVisibleStore);
            const prevPreviewLeaf = get(previewLeafStore)?.leaf;
            // const prevPreviewLeafVisible = get(isPreviewVisibleStore);

            // main leaf
            const mainLeaf = this.getMainLeaf() as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number } | null;
            mainViewLeafStore.set(mainLeaf);

            // check if main view is visible
            const mainLeafvisible = mainLeaf && this.isLeafVisible(mainLeaf)
            isMainViewVisibleStore.set(!!mainLeafvisible)

            // check if main view is reopened
            const isMainLeafReopened = !prevMainViewVisible && mainLeafvisible;
            isMainLeafReopenedStore.set(isMainLeafReopened)

            // preview leaf
            const previewLeaf = this.searchPreviewLeaf()
            if (previewLeaf) {
                // leaf.view.state.file will be used when markdown view is not visible and leaf.view.file.path would return undefined
                // this value is undefined when markdown view is visible
                const filepath = (previewLeaf.view as any)?.state?.file as string | undefined || (previewLeaf.view as any).file?.path as string | null
                filepath && previewLeafStore.set({ leaf: previewLeaf, filepath })
            }

            // check if preview is visible
            const previewLeafVisible = previewLeaf && this.isLeafVisible(previewLeaf)
            isPreviewVisibleStore.set(!!previewLeafVisible)

            // check if preview is maximized
            const isPreviewMaximized = (previewLeaf && this.checkIfPreviewIsMaximized(previewLeaf)) || null;
            isPreviewMaximizedStore.set(isPreviewMaximized)

            // check preview's split direction
            const previewSplitDirection = previewLeaf && this.getPreviewSplitDirection(previewLeaf);
            previewSplitDirection && previewSplitDirectionStore.set(previewSplitDirection);

            // check preview's leaf position
            const previewSplitPosition = previewLeaf && this.getLeafSplitPosition(previewLeaf);
            previewSplitPosition && previewSplitPositionStore.set(previewSplitPosition)

            // check if 'open preview' bttn should be visible
            const isOpenPreviewBttnVisible =
                get(settingsStore).preview.enabled
                && (isPreviewMaximized || previewSplitPosition === 'root' || !previewLeafVisible)
            isOpenPreviewBttnVisibleStore.set(isOpenPreviewBttnVisible)

            console.log("💖💖💖💖💖💖💖 layout change 💖💖💖💖💖💖💖 ")
            console.table({
                mainLeaf,
                mainLeafvisible,
                prevPreviewLeaf,
                previewLeaf,
                previewLeafFile: (previewLeaf?.view as any)?.file,
                // prevPreviewLeafVisible,
                previewLeafVisible,
                previewEnabled: get(settingsStore).preview.enabled,
                previewOpen: get(settingsStore).preview.open,
                isPreviewMaximized,
                previewSplitDirection,
                previewSplitPosition,
                defaultExpandMode: get(settingsStore).preview.defaultExpansionMode,
                processingPreviewChange: get(processingPreviewChangeStore),
                lastPreviewFilepath: get(settingsStore).preview.lastPreviewFilepath,
                firstLayoutChange: this.firstLayoutChange,
                isMainLeafReopened,
                isOpenPreviewBttnVisible,
            })

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
                    || get(isPreviewMaximizedStore)

                // very especific check for when an expanded preview window is moved to a split window
                if (previewLeafVisible && (get(settingsStore).preview.defaultExpansionMode === "maximized" && !isPreviewMaximized)) {
                    settingsStore.update(s => {
                        s.preview.tabHeaderVisible = true;
                        return s;
                    })
                    return;
                }
                // cleanup preview when user closes calendar tab
                if (prevMainLeaf && !mainLeaf) {
                    this.cleanupPreviews()
                    processingPreviewChangeStore.set(true);
                    console.log("❌ mainLeaf not found and removed preview")
                    return;
                }
                // show preview when user moves back to calendar tab and preview is open
                if (!prevPreviewLeaf && !previewLeaf && isMainLeafReopened && get(settingsStore).preview.enabled && get(settingsStore).preview.open && !previewMaximized) {
                    console.log("🌳 initPreview")
                    this.initPreview();
                    processingPreviewChangeStore.set(true);
                    return;
                }
                if (prevPreviewLeaf && !previewLeaf) {
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
    static restartPreview() {
        this.cleanupPreview();
        this.initPreview();
    }

    static async tryInitPreview(defaultFile?: TFile, reveal?: boolean) {
        const previewLeaf = get(previewLeafStore)?.leaf || this.searchPreviewLeaf();
        console.log("🌿🌿🌿🌿 tryInitPreview() 🌿🌿🌿🌿", previewLeaf)
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

        if (file && mainLeaf) {
            const viewLeafPosition = get(settingsStore).viewLeafPosition
            const splitMode = viewLeafPosition === 'root' ? get(settingsStore).preview.centerDefaultSplitMode : get(settingsStore).preview.defaultSplitMode
            const expandMode = get(settingsStore).preview.defaultExpansionMode;

            let previewLeaf: WorkspaceLeaf | null = null;
            if (expandMode === 'maximized') {
                if (viewLeafPosition === 'root') {
                    previewLeaf = window.app.workspace.getLeaf('tab')
                } else {
                    previewLeaf = window.app.workspace[`get${capitalize(viewLeafPosition) as "Left" | "Right"}Leaf`](false);
                }
            } else {
                previewLeaf = window.app.workspace.createLeafBySplit(mainLeaf, splitMode);
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
    }

    static checkIfPreviewIsMaximized(previewLeaf: WorkspaceLeaf | null) {
        const tabHeaderLeaves = (previewLeaf?.parent as any)?.children as WorkspaceLeaf[] | undefined;
        const leaf = previewLeaf as WorkspaceLeaf & { containerEl: HTMLElement };
        let previewIsOnlyWorkspaceLeaf = true;
        let previewIsCalendarLeafSibling = false;

        let isMobile = (window.app as any).isMobile;
        const closestWorkspaceClassname = isMobile ? ".workspace-drawer" : ".workspace-split"
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

        let isMobile = (window.app as any).isMobile;
        const closestWorkspaceClassname = isMobile ? ".workspace-drawer" : ".workspace-split"
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
        console.log("🧹🧹🧹🧹 cleanupPreview() 🧹🧹🧹🧹", previewLeaf)
        previewLeaf?.detach();
        this.cleanupPreviewControls()
        previewLeafStore.set(null);
        this.previewTabHeaderEl = null

        settingsStore.update(s => {
            s.preview.lastPreviewFilepath = ''
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
            if (isPreview.leaf) {
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
                console.log("👑🌿🌿🌿 searchPreviewLeaf() 🌿🌿🌿🌿", leaf, "preview found is the same as the one in store!")
                previewLeaf = leaf
                previewLeafFound = true

                return;
            }
            const isPreview = this.isPreviewLeaf(leaf, file)
            if (isPreview.leaf) {
                console.log("💰🌿🌿🌿 searchPreviewLeaf() 🌿🌿🌿🌿", isPreview.leaf, "preview found!")
                previewLeaf = isPreview.leaf
                previewLeafFound = true
            }
        })
        return previewLeaf as WorkspaceLeaf | null;
    }
    static isPreviewLeaf(leaf: WorkspaceLeaf | null, file: TFile | null = null) {
        let previewLeaf;
        // console.log("🌿🌿🌿🌿 isPreviewLeaf() 🌿🌿🌿🌿")
        // console.table({
        //     leaf,
        //     firstLayoutChange: this.firstLayoutChange,
        //     containsPreviewControls: leaf && Array.from(leaf.view.containerEl.childNodes).find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE),
        //     leafFilepath: file?.path || (leaf && (file?.path || (leaf.view as any)?.state?.file as string | undefined || (leaf.view as any).file?.path as string | undefined)),
        //     lastPreviewFilepath: get(settingsStore).preview.lastPreviewFilepath
        // })

        if (
            leaf
            && leaf.getViewState().type === 'markdown'
            && leaf.view?.containerEl?.dataset?.type !== LEAF_TYPE
            && (this.firstLayoutChange || Array.from(leaf.view.containerEl.childNodes).find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE))
        ) {
            // leaf.view.state.file will be used when markdown view is not visible and leaf.view.file.path would return undefined
            // this value is undefined when markdown view is visible
            const leafFilepath = file?.path || (leaf.view as any)?.state?.file as string | undefined || (leaf.view as any).file?.path as string | undefined;
            const lastPreviewFilepath = get(settingsStore).preview.lastPreviewFilepath;
            console.log("🌿🌿🌿🌿 isPreviewLeaf() > found 🌿🌿🌿🌿", leaf, leafFilepath, lastPreviewFilepath)
            if (leafFilepath === lastPreviewFilepath) {
                previewLeaf = leaf
            }
        }

        return { leaf: previewLeaf }
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
        let date: Moment | null = null;
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
                    const foundFile = getFileData(g, moment()).file;
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
            date = moment()
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
        previewLeafStore.set({ leaf: previewLeaf, filepath: file.path });
        settingsStore.update(s => {
            s.preview.open = true
            s.preview.lastPreviewFilepath = file!.path
            return s
        });
        activeFilepathStore.set(file.path);

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

    static updateCalendarDate() {
        const activeFile = window.app.workspace.getActiveFile();

        if (!activeFile) return;

        const { isValid, granularity, date } = isValidPeriodicNote(activeFile.basename);
        if (typeof isValid && date && granularity) {
            activeFilepathStore.set(activeFile!.path);
            displayedDateStore.set(date!)
            const enabledPeriodsRes = getEnabledPeriods();
            if (enabledPeriodsRes.tabs.includes(granularity as typeof periodTabs[number])) {
                crrTabStore.set(granularity as typeof periodTabs[number])
            }
        }
    }

    static cleaunupPreviewEvHandlers() {
        this.previewLeafCleanups.length > 0 && this.previewLeafCleanups.forEach((cleanup) => cleanup());
        this.previewLeafCleanups = [];
    }

    static unload() {
        window.app.workspace.detachLeavesOfType(LEAF_TYPE);
        this.cleanupPreview();
        this.cleaunupPreviewEvHandlers()
    }
}
