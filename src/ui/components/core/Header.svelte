<script lang="ts">
    import { IGranularity, TFileData } from "@/io";
    import { cn, eventHandlers, isControlPressed } from "@/ui/utils";
    import { getContext, Snippet } from "svelte";

    interface Props {
        leftTitle?: {
            className?: string;
            date: moment.Moment;
            granularity: IGranularity;
            fileData: TFileData;
            formatValue: string;
        } | null;

        rightTitle?: {
            className?: string;
            date: moment.Moment;
            granularity: IGranularity;
            fileData: TFileData;
            formatValue: string;
        } | null;

        leftTitleSnippet?: Snippet;
        rightTitleSnippet?: Snippet;
        bottomNavSnippet?: Snippet;
    }
    let { leftTitle = null, rightTitle = null, leftTitleSnippet, rightTitleSnippet, bottomNavSnippet }: Props = $props();
    let minimalMode = getContext('minimalMode') as { value: boolean } | undefined;
</script>

<div class="flex flex-col mt-4 mb-[1.1rem]" id="header">
    <div
        class="flex justify-between mb-1.5 items-baseline text-[--color-text-title]"
        id="title"
    >
        <!-- left title -->
        {@render leftTitleSnippet?.()}
        {#if leftTitle}
            <button
                class={cn(
                    "h-auto font-semibold hover:!shadow-[3px_0px_0_7px_var(--interactive-hover)] rounded-[2px] p-0",
                    minimalMode?.value ? "text-xl" : "text-7xl"
                )}
                id={leftTitle.granularity}
                onclick={(event) =>
                    eventHandlers.onClick({
                        date: leftTitle.date,
                        createNewSplitLeaf: isControlPressed(event),
                        granularity: leftTitle.granularity,
                    })}
                oncontextmenu={(event) =>
                    eventHandlers.onContextMenu({
                        event,
                        fileData: leftTitle.fileData,
                        date: leftTitle.date,
                        granularity: leftTitle.granularity,
                    })}
                onpointerenter={(event) => {
                    eventHandlers.onHover({
                        event,
                        isControlPressed: isControlPressed(event),
                        file: leftTitle.fileData.file,
                    });
                }}
            >
                {leftTitle.date.format(leftTitle.formatValue)}
            </button>
        {/if}
        <!-- right title -->
        {@render rightTitleSnippet?.()}
        {#if rightTitle}
            <button
                class={cn(
                    "text-[--interactive-accent] font-medium hover:!shadow-[0px_0px_0px_6px_var(--interactive-hover)] rounded-[2px] p-0",
                    minimalMode?.value ? "text-sm" : "text-lg"
                )}
                id={rightTitle.granularity}
                onclick={(event) =>
                    eventHandlers.onClick({
                        date: rightTitle.date,
                        createNewSplitLeaf: isControlPressed(event),
                        granularity: rightTitle.granularity,
                    })}
                oncontextmenu={(event) =>
                    eventHandlers.onContextMenu({
                        event,
                        fileData: rightTitle.fileData,
                        date: rightTitle.date,
                        granularity: rightTitle.granularity,
                    })}
                onpointerenter={(event) => {
                    eventHandlers.onHover({
                        event,
                        isControlPressed: isControlPressed(event),
                        file: rightTitle.fileData.file,
                    });
                }}
            >
                {rightTitle.date.format(rightTitle.formatValue)}
            </button>
        {/if}
    </div>

    {@render bottomNavSnippet?.()}
</div>
