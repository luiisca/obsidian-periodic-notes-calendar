import { LEAF_TYPE, PREVIEW_CONTROLS_TYPE } from '@/constants';
import { createNote, getFileData, IGranularity } from '@/io';
import { PeriodSettings, settingsStore, type ISettings } from '@/settings';
import { activeFilepathStore, isPreviewMaximizedStore, previewLeafStore, previewSplitDirectionStore, previewSplitPositionStore, processingPreviewChangeStore } from '@/stores';
import { capitalize } from '@/utils';
import moment from 'moment';
import { TFile, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import { get } from 'svelte/store';
import { PreviewControls } from '.';

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

    static revealView() {
        // get calendar view and set it as active
        window.app.workspace.revealLeaf(window.app.workspace.getLeavesOfType(LEAF_TYPE)[0]);
        window.app.workspace.getLeavesOfType(LEAF_TYPE)[0].setViewState({
            type: LEAF_TYPE,
            active: true
        });
    }

    private static setupVisibilityTracking(): () => void {
        // Handler for layout changes
        const handleLayoutChange = async () => {
            const mainLeaf = this.mainLeaf as WorkspaceLeaf & { containerEl: HTMLElement, width: number, height: number } | null;
            const previewLeaf = this.searchPreviewLeaf()
            const mainLeafvisible = mainLeaf && this.isLeafVisible(mainLeaf)
            const previewLeafVisible = previewLeaf && this.isLeafVisible(previewLeaf)

            // check if preview is maximized
            const isPreviewMaximized = this.checkIfPreviewIsMaximized(previewLeaf);
            isPreviewMaximizedStore.set(isPreviewMaximized)

            // check preview's split direction
            const previewSplitDirection = this.getPreviewSplitDirection(previewLeaf);
            previewSplitDirection && previewSplitDirectionStore.set(previewSplitDirection);

            // check preview's leaf position
            const previewSplitPosition = this.getLeafSplitPosition(previewLeaf as WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement });
            previewSplitPositionStore.set(previewSplitPosition)

            // avoid toggling preview if it has transitioned to an expanded-like state (moved to another tab)
            if (isPreviewMaximized) {
                settingsStore.update(s => {
                    s.preview.visible = false;
                    return s;
                })
                processingPreviewChangeStore.set(false);
                return;
            };
            // very especific check for when an expanded preview window is moved to a split window
            if (previewLeafVisible && (get(settingsStore).preview.defaultExpansionMode === "maximized" && !isPreviewMaximized)) {
                settingsStore.update(s => {
                    s.preview.visible = true;
                    s.preview.tabHeaderVisible = true;
                    return s;
                })
                return;
            }

            if (!get(processingPreviewChangeStore)) {
                const expandMode = get(settingsStore).preview.defaultExpansionMode
                if (!previewLeaf) {
                    const storedPreviewLeaf = get(previewLeafStore)?.leaf
                    this.cleanupPreview({ leaf: storedPreviewLeaf! });
                    return;
                }
                if (expandMode === 'split') {
                    if (mainLeafvisible && !previewLeaf && get(settingsStore).preview.visible) {
                        this.initPreview();
                        return;
                    }
                }
                if (!mainLeafvisible && previewLeaf && get(settingsStore).preview.visible) {
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

    static async initPreview(defaultFile?: TFile) {
        processingPreviewChangeStore.set(true);

        await this.tryPreviewCleanup({ defaultFile });

        if (!get(settingsStore).preview.visible) {
            const file: TFile | null = defaultFile || await this.getFile();

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
                    this.setupOpenPreviewLeaf(file, previewLeaf)
                }
            }
        }

        processingPreviewChangeStore.set(false);
    }

    static cleanup() {
        window.app.workspace.detachLeavesOfType(LEAF_TYPE);
        this.tryPreviewCleanup();
        settingsStore.update(s => {
            s.preview.visible = false
            return s
        })
    }
    static async tryPreviewCleanup({ leaf, defaultFile }: { leaf?: WorkspaceLeaf, defaultFile?: TFile } = {}) {
        const previewLeaf = leaf || this.searchPreviewLeaf() || get(previewLeafStore)?.leaf ;
        if (previewLeaf) {
            if (this.checkIfPreviewIsMaximized(previewLeaf)) {
                const file = defaultFile || await this.getFile()
                if (file) {
                    this.setupOpenPreviewLeaf(file, previewLeaf)
                }
            } else {
                this.cleanupPreview({ leaf: previewLeaf });
            }
        }
    }
    static checkIfPreviewIsMaximized(previewLeaf: WorkspaceLeaf | null) {
        const tabHeaderLeaves = (previewLeaf?.parent as any)?.children as WorkspaceLeaf[] | undefined;
        let previewIsCalendarLeafSibling = false;
        if (tabHeaderLeaves) {
            for (let i = 0; i < tabHeaderLeaves.length; i++) {
                if (previewIsCalendarLeafSibling) break;

                const leaf = tabHeaderLeaves[i] as WorkspaceLeaf & { containerEl: HTMLElement };
                const childNodes = leaf.containerEl?.childNodes as unknown as HTMLElement[]
                for (let j = 0; j < childNodes.length; j++) {
                    const el = childNodes[j];
                    if (el.dataset.type === LEAF_TYPE) {
                        previewIsCalendarLeafSibling = true
                        break;
                    }
                }
            }
        }
        return previewIsCalendarLeafSibling
    }
    static getPreviewSplitDirection(previewLeaf: WorkspaceLeaf | null) {
        return ((previewLeaf?.parent?.parent as any)?.direction || null) as 'vertical' | 'horizontal' | null;
    }
    static getLeafSplitPosition(leaf: WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement } | null) {
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
    /**
        * Passing `restart` sets `s.preview.visible` to null which signals `initPreview` to create a new preview split.
        * Effectively restarting the preview
    */
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
            s.preview.visible = false
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
                && (leaf as WorkspaceLeaf & { containerEl: HTMLElement })?.containerEl?.closest(".workspace-split")?.className.includes(`mod-${get(settingsStore).viewLeafPosition}`)
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
        const previewLeaf = this.searchPreviewLeaf() || get(previewLeafStore)?.leaf || null
        const isPreviewMaximized = this.checkIfPreviewIsMaximized(previewLeaf);
        if (isPreviewMaximized) return;

        this.previewTabHeaderEl = (previewLeaf?.parent as any).tabHeaderContainerEl as HTMLElement | null
        if (this.previewTabHeaderEl) {
            if (!get(settingsStore).preview.tabHeaderVisible) {
                this.previewTabHeaderEl.style.display = 'none'
            } else {
                this.previewTabHeaderEl.style.display = 'flex'
            }
        }
    }

    private static async getFile() {
        let file: TFile | null = null;
        let createNewFile: { granularity: IGranularity | null; create: boolean} = { granularity: null, create: false };
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
                        createNewFile = { granularity: g, create: true }
                    } else {
                        file = foundFile
                    }
                }
            }
        })

        if (createNewFile.create && createNewFile.granularity) {
            file = await createNote(createNewFile.granularity, moment());
            return file
        }
        return file;
    }
    static setupOpenPreviewLeaf(file: TFile, previewLeaf: WorkspaceLeaf) {
        previewLeaf.openFile(file);
        previewLeafStore.set({ leaf: previewLeaf, file });
        settingsStore.update(s => {
            s.preview.visible = true
            s.preview.lastPreviewFilepath = file!.path
            return s
        });
        activeFilepathStore.set(file.path);

        this.togglePreviewTabHeader()

        // add overlay control buttons
        if (!this.previewControlsComponent) {
            this.previewControlsComponent = mount(PreviewControls, {
                target: previewLeaf.view.containerEl,
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
