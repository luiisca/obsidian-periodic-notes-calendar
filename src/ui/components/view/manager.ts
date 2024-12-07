import { LEAF_TYPE, PREVIEW_CONTROLS_TYPE } from '@/constants';
import { createNote, getFileData, IGranularity } from '@/io';
import { isValidPeriodicNote } from '@/io/validation';
import { PeriodSettings, settingsStore, type ISettings } from '@/settings';
import { activeFilepathStore, displayedDateStore, ILastOpenedFileValidationData, isMainViewVisibleStore, isOpenPreviewBttnVisibleStore, isPreviewMaximizedStore, isPreviewVisibleStore, lastOpenedFileValidationDataStore, mainViewLeafStore, previewLeafStore, previewSplitDirectionStore, previewSplitPositionStore, processingPreviewChangeStore } from '@/stores';
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

        if (this.getMainLeaf() && get(settingsStore).preview.enabled) {
            const cleanup = this.setupVisibilityTracking();
            this.previewLeafCleanups.push(cleanup);
        } else {
            this.cleanupPreview();
        }

        return mainLeaf;
    }

    static revealView(type: 'view' | 'preview' = 'view', workspaceLeaf?: WorkspaceLeaf) {
        let leaf: WorkspaceLeaf | undefined | null = null;
        if (type === 'preview') {
            leaf = workspaceLeaf || get(previewLeafStore)?.leaf;
            if (leaf) {
                window.app.workspace.revealLeaf(leaf);
            }
        }
        if (type === 'view') {
            leaf = window.app.workspace.getLeavesOfType(LEAF_TYPE)[0];
            window.app.workspace.revealLeaf(leaf);
            leaf.setViewState({
                type: LEAF_TYPE,
                active: true
            });
        }
    }

    private static setupVisibilityTracking(): () => void {
        // Handler for layout changes
        const handleLayoutChange = async () => {
            const prevMainLeaf = get(mainViewLeafStore)
            const prevMainViewVisible = get(isMainViewVisibleStore);
            const prevPreviewLeaf = get(previewLeafStore)?.leaf;

            // main leaf
            const mainLeaf = this.getMainLeaf() as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number } | null;
            mainViewLeafStore.set(mainLeaf);

            // check if main view is visible
            const mainLeafvisible = mainLeaf && this.isLeafVisible(mainLeaf)
            isMainViewVisibleStore.set(!!mainLeafvisible)

            // preview leaf
            const previewLeaf = this.searchPreviewLeaf()
            previewLeafStore.set({ leaf: previewLeaf, file: (previewLeaf?.view as any)?.file })

            // check if preview is visible
            const previewLeafVisible = previewLeaf && this.isLeafVisible(previewLeaf)
            isPreviewVisibleStore.set(!!previewLeafVisible)

            // check if preview is maximized
            const isPreviewMaximized = this.checkIfPreviewIsMaximized(previewLeaf);
            isPreviewMaximizedStore.set(isPreviewMaximized)

            // check preview's split direction
            const previewSplitDirection = this.getPreviewSplitDirection(previewLeaf);
            previewSplitDirection && previewSplitDirectionStore.set(previewSplitDirection);

            // check preview's leaf position
            const previewSplitPosition = this.getLeafSplitPosition(previewLeaf);
            previewSplitPosition && previewSplitPositionStore.set(previewSplitPosition)

            // check if 'open preview' bttn should be visible
            isOpenPreviewBttnVisibleStore.set(
                get(settingsStore).preview.enabled
                && (isPreviewMaximized || previewSplitPosition === 'root' || !previewLeafVisible)
            )

            console.log("💖💖💖💖💖💖💖 layout change 💖💖💖💖💖💖💖 ")
            console.table({
                mainLeaf,
                mainLeafvisible,
                prevPreviewLeaf,
                previewLeaf,
                previewLeafFile: (previewLeaf?.view as any)?.file,
                previewLeafVisible,
                previewEnabled: get(settingsStore).preview.enabled,
                previewOpen: get(settingsStore).preview.open,
                isPreviewMaximized,
                previewSplitDirection,
                previewSplitPosition,
                defaultExpandMode: get(settingsStore).preview.defaultExpansionMode,
                processingPreviewChange: get(processingPreviewChangeStore),
                lastPreviewFilepath: get(settingsStore).preview.lastPreviewFilepath,
                firstLayoutChange: this.firstLayoutChange
            })
            // avoid toggling preview if it has transitioned to an expanded-like state (moved to another tab)
            if (isPreviewMaximized) {
                processingPreviewChangeStore.set(false);
                return;
            };
            // very especific check for when an expanded preview window is moved to a split window
            if (previewLeafVisible && (get(settingsStore).preview.defaultExpansionMode === "maximized" && !isPreviewMaximized)) {
                settingsStore.update(s => {
                    s.preview.tabHeaderVisible = true;
                    return s;
                })
                return;
            }

            if (!get(processingPreviewChangeStore)) {
                console.log("🙌 layout change, about to perform preview change checks")

                // cleanup preview when user closes calendar tab
                if (prevMainLeaf && !mainLeaf) {
                    this.cleanupPreview()
                    processingPreviewChangeStore.set(true);
                    console.log("❌ mainLeaf not found and removed preview")
                    return;
                }
                // show preview when user moves back to calendar tab and preview is open
                if (!prevPreviewLeaf && !previewLeaf && !prevMainViewVisible && mainLeafvisible && get(settingsStore).preview.enabled && get(settingsStore).preview.open) {
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
                if (previewLeaf && previewLeafVisible && !mainLeafvisible && previewSplitPosition === get(settingsStore).viewLeafPosition) {
                    this.cleanupPreview({ leaf: previewLeaf });
                    processingPreviewChangeStore.set(true);
                    console.log("❌ moved out of calendar view to a different tab, removed preview")
                    return;
                }
            } else {
                processingPreviewChangeStore.set(false);
            }

            if (this.firstLayoutChange) {
                this.firstLayoutChange = false;
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
        const previewLeaf = this.searchPreviewLeaf();
        console.log("tryInitPreview > Preview leaf", previewLeaf)
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

        if (file && this.getMainLeaf()) {
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
                previewLeaf = window.app.workspace.createLeafBySplit(this.getMainLeaf(), splitMode);
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

        const children = leaf?.containerEl?.closest('.workspace-split')?.children || null
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
        // console.table({
        //     tabHeaderLeaves,
        //     leaf,
        //     previewIsCalendarLeafSibling
        // })
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

        const closestWorkspaceSplitClassName =
            leaf?.containerEl.closest('.workspace-split')?.className;

        if (closestWorkspaceSplitClassName?.includes('left')) {
            return 'left';
        }

        if (closestWorkspaceSplitClassName?.includes('right')) {
            return 'right';
        }

        return 'root';
    }
    static cleanupPreview({ leaf }: { leaf?: WorkspaceLeaf } = {}) {
        const previewLeaf = leaf || get(previewLeafStore)?.leaf
        previewLeaf?.detach();
        this.previewControlsComponent && unmount(this.previewControlsComponent)
        this.previewControlsComponent = null;
        previewLeafStore.set(null);
        this.previewTabHeaderEl = null

        settingsStore.update(s => {
            s.preview.lastPreviewFilepath = ''
            return s
        })
    }

    static getMainLeaf() {
        return window.app.workspace.getLeavesOfType(LEAF_TYPE)[0] as WorkspaceLeaf | null
    }
    static searchPreviewLeaf(file?: TFile) {
        let previewLeafFound = false;
        let previewLeaf: WorkspaceLeaf | null = null;
        window.app.workspace.iterateAllLeaves((leaf) => {
            // on first layout change, preview controls arent mounted so we need to check
            // for whether the leaf is in its default position
            // console.log((leaf as any).containerEl, leaf, leaf.getViewState(), leaf.getViewState().type)
            if (leaf.getViewState().type === 'markdown') {
            }
            if (
                !previewLeafFound
                && leaf.getViewState().type === 'markdown'
                && leaf.view?.containerEl?.dataset?.type !== LEAF_TYPE
                && (this.firstLayoutChange || Array.from(leaf.view.containerEl.childNodes).find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE))
                && (!this.firstLayoutChange || this.getLeafSplitPosition(leaf) === get(settingsStore).viewLeafPosition)
            ) {
                const leafFile = file || (leaf.view as any).file as TFile | undefined;
                const lastPreviewFilepath = get(settingsStore).preview.lastPreviewFilepath;
                // console.table({
                //     leafFile,
                //     lastPreviewFilepath
                // })
                if (leafFile?.path === lastPreviewFilepath) {
                    previewLeaf = leaf
                    previewLeafFound = true;
                }
            }
        })
        return previewLeaf as WorkspaceLeaf | null;
    }

    static togglePreviewTabHeader(leaf?: WorkspaceLeaf) {
        const previewLeaf = leaf || get(previewLeafStore)?.leaf
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
        previewLeafStore.set({ leaf: previewLeaf, file });
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

    static toggleRevealInCalendarCommand() {
        const REVEAL_COMMAND_ID = 'reveal-periodic-note-on-calendar';
        let op: "add" | "remove" = "remove";
        const activeFile = window.app.workspace.getActiveFile();
        // console.log("toggleRevealInCalendarCommand > activeFile", activeFile, window.app.workspace, window.app.workspace.getActiveFile(), window.app.workspace.getActiveFile)
        const lastOpenedFileValidationData = get(lastOpenedFileValidationDataStore);
        let validatedFileRes: ILastOpenedFileValidationData;

        if (activeFile === null) {
            op = "remove";
        } else {
            if (activeFile.path === lastOpenedFileValidationData?.path) {
                validatedFileRes = lastOpenedFileValidationData
            } else {
                validatedFileRes = { ...isValidPeriodicNote(activeFile.basename), path: activeFile.path };
            }
            const { isValid, granularity, date } = validatedFileRes;
            if (typeof isValid && date && granularity) {
                op = 'add'
            }
        }

        switch (op) {
            case 'add':
                window.plugin?.addCommand({
                    id: REVEAL_COMMAND_ID,
                    name: "Reveal Periodic Note on Calendar",
                    callback: () => {
                        ViewManager.revealView();
                        activeFilepathStore.set(activeFile!.path);
                        displayedDateStore.set(validatedFileRes.date!)
                        const enabledPeriodsRes = getEnabledPeriods();
                        if (enabledPeriodsRes.tabs.includes(validatedFileRes.granularity as typeof periodTabs[number])) {
                            crrTabStore.set(validatedFileRes.granularity as typeof periodTabs[number])
                        }
                    }
                })

                break;

            case 'remove':
                window.plugin?.removeCommand(REVEAL_COMMAND_ID);

                break;
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
