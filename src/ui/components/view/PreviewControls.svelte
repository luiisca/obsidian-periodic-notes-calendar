<script lang="ts">
    import {
        BASE_POPOVER_ID,
        FILE_MENU_POPOVER_ID,
        PREVIEW_CONTROLS_TYPE,
    } from "@/constants";
    import {
        createNote,
        getFileData,
        getPeriodicityFromGranularity,
        IGranularity,
    } from "@/io";
    import { settingsStore } from "@/settings";
    import {
        isPreviewMaximizedStore,
        previewLeafStore,
        previewSplitDirectionStore,
        previewSplitPositionStore,
        processingPreviewChangeStore,
        todayStore,
    } from "@/stores";
    import { Popover } from "@/ui/popovers";
    import { cn, eventHandlers, getSticker } from "@/ui/utils";
    import { capitalize } from "@/utils";
    import {
        MarkdownView,
        Menu,
        setIcon,
        TFile,
        WorkspaceLeaf,
    } from "obsidian";
    import { Dot } from "../core";
    import { Outline } from "./outline";
    import { goToNoteHeading } from "./utils";
    import { ViewManager } from "@/ui";
    import { Moment } from "moment";

    interface Props {
        date: Moment;
    }
    const { date }: Props = $props();

    let file: TFile | null = $state(null);
    let leaf: WorkspaceLeaf | null = $state(null);
    let markdownView: MarkdownView | null = $state(null);
    let outlineBttn: HTMLElement | null = $state(null);
    let moreEl: HTMLElement | null = $state(null);
    let outlineOpen = $state(false);
    let enabledGranularities = $derived(
        $settingsStore.preview.enabledGranularities,
    );
    let crrGranularity = $derived($settingsStore.preview.crrGranularity);

    const handleOutlineClick = (event: MouseEvent | KeyboardEvent) => {
        Popover.create({
            id: BASE_POPOVER_ID,
            view: {
                Component: Outline,
            },
            cbs: {
                onOpen: () => (outlineOpen = true),
                onClose: () => (outlineOpen = false),
            },
        }).toggle(event.target as Element);
    };
    const handleMoreClick = (event: MouseEvent) => {
        const tags = file
            ? window.app.metadataCache.getFileCache(file)?.tags
            : null;
        const sticker = getSticker(tags);

        const addExtraItems = (menu: Menu) => {
            // close preview
            menu.addItem((item) =>
                item
                    .setSection("preview")
                    .setTitle("Close preview")
                    .setIcon("lucide-x-circle")
                    .onClick((ev) => {
                        ev.stopPropagation();

                        menu.close();

                        leaf && ViewManager.cleanupPreview({ leaf });
                        processingPreviewChangeStore.set(true);
                    }),
            );

            // Go to main section
            menu.addItem((item) =>
                item
                    .setSection("preview")
                    .setTitle("Go to main section")
                    .setIcon("lucide-compass")
                    .onClick((ev) => {
                        ev.stopPropagation();

                        const settings =
                            crrGranularity &&
                            $settingsStore.periods[crrGranularity];
                        const mainSection = settings?.preview.mainSection;

                        goToNoteHeading({
                            heading: mainSection,
                            extra: () => menu.close(),
                        });
                    }),
            );

            // Go to todo section
            menu.addItem((item) =>
                item
                    .setSection("preview")
                    .setTitle("Go to todo section")
                    .setIcon("lucide-list-todo")
                    .onClick((ev) => {
                        ev.stopPropagation();

                        const settings =
                            crrGranularity &&
                            $settingsStore.periods[crrGranularity];
                        const todoSection = settings?.preview.todoSection;

                        goToNoteHeading({
                            heading: todoSection,
                            extra: () => menu.close(),
                        });
                    }),
            );

            // Toggle tab header visibility
            if (
                !$isPreviewMaximizedStore &&
                $previewSplitPositionStore !== "root"
            ) {
                menu.addItem((item) => {
                    return item
                        .setSection("preview")
                        .setTitle("Display Tab Header")
                        .setChecked($settingsStore.preview.tabHeaderVisible)
                        .setIcon("lucide-layout-panel-top")
                        .onClick(() => {
                            settingsStore.update((s) => {
                                s.preview.tabHeaderVisible =
                                    !s.preview.tabHeaderVisible;
                                return s;
                            });
                            ViewManager.togglePreviewTabHeader();
                        });
                });
            }

            // Toggle Zen mode
            menu.addItem((item) => {
                return item
                    .setSection("preview")
                    .setTitle("Zen mode")
                    .setChecked($settingsStore.preview.zenMode)
                    .setIcon("lucide-flower")
                    .onClick(() => {
                        settingsStore.update((s) => {
                            s.preview.zenMode = !s.preview.zenMode;
                            return s;
                        });
                    });
            });
        };

        Popover.create({
            id: FILE_MENU_POPOVER_ID,
        }).open({
            event,
            date,
            fileData: { file, sticker },
            extraItems: {
                newSections: ["preview"],
                add: addExtraItems,
            },
        });
    };

    const handleDotClick = async (granularity: IGranularity) => {
        settingsStore.update((s) => {
            s.preview.crrGranularity = granularity;
            return s;
        });

        const foundFile = getFileData(granularity, $todayStore).file;
        let file = foundFile;
        if (!foundFile) {
            file = await createNote(granularity, $todayStore);
        }
        const data = await ViewManager.getPreviewFileData();
        const previewLeaf =
            $previewLeafStore?.leaf || ViewManager.searchPreviewLeaf();
        file &&
            previewLeaf &&
            ViewManager.setupOpenPreviewLeaf({
                file,
                granularity: data.granularity,
                date: data.date,
                previewLeaf,
            });
    };

    $effect.pre(() => {
        if ($previewLeafStore) {
            file = $previewLeafStore.file;
            leaf = $previewLeafStore.leaf;
            if (leaf) {
                markdownView = leaf.view as MarkdownView;
            }
        }
    });
    $effect.pre(() => {
        if (outlineBttn) {
            setIcon(outlineBttn, "lucide-list");
        }
        if (moreEl) {
            setIcon(moreEl, "lucide-more-vertical");
        }
    });
</script>

{#snippet OutlineBttn()}
    {#if !$settingsStore.preview.zenMode && file}
        <div
            tabindex="0"
            role="button"
            class={cn(
                "clickable-icon view-action cursor-pointer !transition-none",
                outlineOpen && "is-active",
            )}
            aria-label={`Outline of ${file.basename}`}
            data-tooltip-delay="200"
            data-type="outline"
            id={`${BASE_POPOVER_ID}-outline-ref-el`}
            onclick={handleOutlineClick}
            onkeydown={handleOutlineClick}
        >
            <div class="workspace-tab-header-inner !p-0">
                <div
                    bind:this={outlineBttn}
                    class="workspace-tab-header-inner-icon"
                ></div>
            </div>
        </div>
    {/if}
{/snippet}
{#snippet MoreBttn()}
    <button
        class={cn("clickable-icon view-action ml-0 cursor-pointer")}
        bind:this={moreEl}
        aria-label="More options"
        data-tooltip-delay="200"
        onclick={handleMoreClick}
    ></button>
{/snippet}

<div data-type={PREVIEW_CONTROLS_TYPE}>
    {#if file && leaf}
        {#if !$settingsStore.timeline.enabled && $previewSplitPositionStore !== "root"}
            <div
                class="absolute right-0 top-0 flex space-x-1 pb-1.5 mt-1.5 px-3 h-[var(--header-height)]"
            >
                {@render OutlineBttn()}
                {@render MoreBttn()}
            </div>
        {/if}
        <div
            class={cn(
                "absolute top-1/2 -translate-y-1/2 flex flex-col gap-y-1 opacity-80 items-center right-1",
            )}
        >
            {#if $settingsStore.timeline.enabled || $previewSplitPositionStore === "root"}
                {@render OutlineBttn()}
            {/if}
            {#if !$settingsStore.preview.zenMode && enabledGranularities}
                {#each enabledGranularities as g}
                    <div
                        tabindex="0"
                        role="button"
                        class="cursor-pointer"
                        onclick={() => handleDotClick(g)}
                        onkeydown={() => handleDotClick(g)}
                        aria-label={`${capitalize(getPeriodicityFromGranularity(g))} preview`}
                    >
                        <Dot
                            isActive={g === crrGranularity}
                            isFilled={g === crrGranularity}
                            className="w-2 h-2 m-0"
                        />
                    </div>
                {/each}
            {/if}
            {#if $settingsStore.timeline.enabled || $previewSplitPositionStore === "root"}
                {@render MoreBttn()}
            {/if}
        </div>
    {/if}
</div>
