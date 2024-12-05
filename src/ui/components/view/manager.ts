import { LEAF_TYPE, PREVIEW_CONTROLS_TYPE } from '@/constants';
import { createNote, getFileData, IGranularity } from '@/io';
import { PeriodSettings, settingsStore, type ISettings } from '@/settings';
import { activeFilepathStore, isOpenPreviewBttnVisibleStore, isPreviewMaximizedStore, isPreviewVisibleStore, previewLeafStore, previewSplitDirectionStore, previewSplitPositionStore, processingPreviewChangeStore } from '@/stores';
import { capitalize } from '@/utils';
import moment, { Moment } from 'moment';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import { get } from 'svelte/store';
import { PreviewControls } from '.';
import { isValidPeriodicNote } from '@/io/validation';

export class ViewManager {
    static mainLeaf: WorkspaceLeaf | null;
    static previewControlsComponent: Record<string, any> | null;
    static previewTabHeaderEl: HTMLElement | null;
    static previewLeafCleanups: (() => void)[] = [];

    static async initView({ active }: { active: boolean } = { active: true }) {
        this.cleanup()

        const leafPosition = get(settingsStore).viewLeafPosition as ISettings["viewLeafPosition"];
        if (leafPosition === 'root') {
            this.mainLeaf = window.app.workspace.getLeaf('tab')
            this.mainLeaf?.setViewState({
                type: LEAF_TYPE,
                active
            })
        } else {
            this.mainLeaf = window.app.workspace[`get${capitalize(leafPosition) as "Left" | "Right"}Leaf`](false);
            this.mainLeaf?.setViewState({
                type: LEAF_TYPE,
                active
            });
        }

        if (this.mainLeaf && get(settingsStore).preview.enabled) {
            const cleanup = this.setupVisibilityTracking();
            this.previewLeafCleanups.push(cleanup);
        } else {
            this.cleanupPreview();
        }
    }

    static revealView(type?: 'view' | 'preview' = 'view', workspaceLeaf?: WorkspaceLeaf) {
        let leaf: WorkspaceLeaf | undefined | null = null;
        if (type === 'preview') {
            leaf = workspaceLeaf;
        }
        if (type === 'view') {
            leaf = window.app.workspace.getLeavesOfType(LEAF_TYPE)[0];
        }

        if (leaf) {
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
            const mainLeaf = this.mainLeaf as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number } | null;
            const previewLeaf = this.searchPreviewLeaf()
            const mainLeafvisible = mainLeaf && this.isLeafVisible(mainLeaf)

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
            const previewSplitPosition = this.getLeafSplitPosition(previewLeaf as WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement } | null);
            previewSplitPosition && previewSplitPositionStore.set(previewSplitPosition)

            // check if 'open preview' bttn should be visible
            isOpenPreviewBttnVisibleStore.set(
                get(settingsStore).preview.enabled 
                && (isPreviewMaximized || previewSplitPosition === 'root' || !previewLeafVisible)
            )

            console.table({
                mainLeaf,
                mainLeafvisible,
                previewLeaf,
                previewLeafVisible,
                isPreviewMaximized,
                previewSplitDirection,
                previewSplitPosition,
                defaultExpandMode: get(settingsStore).preview.defaultExpansionMode
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
                if (!previewLeaf) {
                    this.cleanupPreview();
                    return;
                }
                if (previewLeaf && previewLeafVisible && !mainLeafvisible && previewSplitPosition === get(settingsStore).viewLeafPosition) {
                    this.cleanupPreview({ leaf: previewLeaf });
                    return;
                }
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

    static async initPreview(defaultFile?: TFile, reveal?: boolean) {
        processingPreviewChangeStore.set(true);

        const previewLeaf = await this.tryPreviewCleanup({ defaultFile });
        if (!previewLeaf) {
            const data = await this.getPreviewFileData();
            const file = defaultFile || data.file;

            if (file && this.mainLeaf) {
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
                    previewLeaf = window.app.workspace.createLeafBySplit(this.mainLeaf, splitMode);
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
        } else {
            reveal && this.revealView('preview', previewLeaf);
        }

        processingPreviewChangeStore.set(false);
    }

    static cleanup() {
        window.app.workspace.detachLeavesOfType(LEAF_TYPE);
        this.tryPreviewCleanup();
    }
    static async tryPreviewCleanup({ leaf, defaultFile }: { leaf?: WorkspaceLeaf, defaultFile?: TFile } = {}) {
        const previewLeaf = leaf || this.searchPreviewLeaf();
        if (previewLeaf) {
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
            return previewLeaf
        }

        return null;
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
        return previewIsOnlyWorkspaceLeaf || previewIsCalendarLeafSibling
    }
    static getPreviewSplitDirection(previewLeaf: WorkspaceLeaf | null) {
        return ((previewLeaf?.parent?.parent as any)?.direction || null) as 'vertical' | 'horizontal' | null;
    }
    static getLeafSplitPosition(leaf: WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement } | null) {
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
        processingPreviewChangeStore.set(true);

        const previewLeaf = leaf || this.searchPreviewLeaf() || get(previewLeafStore)?.leaf 
        previewLeaf?.detach();
        this.previewControlsComponent && unmount(this.previewControlsComponent)
        this.previewControlsComponent = null;
        previewLeafStore.set(null);
        this.previewTabHeaderEl = null

        settingsStore.update(s => {
            s.preview.lastPreviewFilepath = ''
            return s
        })

        processingPreviewChangeStore.set(false);
    }
    static searchPreviewLeaf(file?: TFile) {
        let previewLeafFound = false;
        let previewLeaf: WorkspaceLeaf | null = null;
        window.app.workspace.iterateAllLeaves((leaf) => {
            if (
                !previewLeafFound
                && leaf.getViewState().type === 'markdown'
                && leaf.view?.containerEl?.dataset?.type !== LEAF_TYPE
                && (this.previewControlsComponent ? Array.from(leaf.view.containerEl.childNodes).find((el: HTMLElement) => el?.dataset?.type === PREVIEW_CONTROLS_TYPE) : true)
            ) {
                const leafFile = file || (leaf.view as any).file as TFile | undefined;
                if (leafFile?.path === get(settingsStore).preview.lastPreviewFilepath) {
                    previewLeaf = leaf
                    previewLeafFound = true;
                }
            }
        })
        return previewLeaf as WorkspaceLeaf | null;
    }

    static togglePreviewTabHeader() {
        const previewLeaf = this.searchPreviewLeaf() || null
        const isPreviewMaximized = this.checkIfPreviewIsMaximized(previewLeaf);
        if (isPreviewMaximized) return;

        this.previewTabHeaderEl = (previewLeaf?.parent as any).tabHeaderContainerEl as HTMLElement | null
        if (this.previewTabHeaderEl && get(previewSplitDirectionStore) === 'horizontal' && get(previewSplitPositionStore) !== 'root') {
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
    static setupOpenPreviewLeaf({
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
        previewLeaf.openFile(file);
        previewLeafStore.set({ leaf: previewLeaf, file });
        settingsStore.update(s => {
            s.preview.lastPreviewFilepath = file!.path
            return s
        });
        activeFilepathStore.set(file.path);

        this.togglePreviewTabHeader()

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

    static cleaunupPreviewEvHandlers() {
        this.previewLeafCleanups.length > 0 && this.previewLeafCleanups.forEach((cleanup) => cleanup());
        this.previewLeafCleanups = [];
    }

    static unload() {
        this.cleanup();
        this.cleaunupPreviewEvHandlers()
    }
}
