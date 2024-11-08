<script lang="ts">
    import { IGranularity, TFileData } from "@/io";
    import { eventHandlers, isControlPressed } from "../utils";

    export let leftTitle: {
        className?: string;
        date: moment.Moment;
        granularity: IGranularity;
        fileData: TFileData;
        formatValue: string;
    } | null = null;
    export let rightTitle: {
        className?: string;
        date: moment.Moment;
        granularity: IGranularity;
        fileData: TFileData;
        formatValue: string;
    } | null = null;
</script>

<div class="flex flex-col mt-4 mb-[1.1rem]" id="header">
    <div
        class="flex justify-between mb-1.5 items-baseline text-[--color-text-title]"
        id="title"
    >
        <!-- left title -->
        <slot name="left-title" />
        {#if leftTitle}
            <button
                class="h-auto text-7xl font-semibold hover:!shadow-[3px_0px_0_7px_var(--interactive-hover)] rounded-[2px] p-0"
                id={leftTitle.granularity}
                on:click={(event) =>
                    eventHandlers.onClick({
                        date: leftTitle.date,
                        createNewSplitLeaf: isControlPressed(event),
                        granularity: leftTitle.granularity,
                    })}
                on:contextmenu={(event) =>
                    eventHandlers.onContextMenu({
                        event,
                        fileData: leftTitle.fileData,
                        date: leftTitle.date,
                        granularity: leftTitle.granularity,
                    })}
                on:pointerenter={(event) => {
                    eventHandlers.onHover({
                        targetEl: event.target,
                        isControlPressed: isControlPressed(event),
                        file: leftTitle.fileData.file,
                    });
                }}
            >
                {leftTitle.date.format(leftTitle.formatValue)}
            </button>
        {/if}
        <!-- right title -->
        <slot name="right-title" />
        {#if rightTitle}
            <button
                class="text-[--interactive-accent] font-medium text-lg hover:!shadow-[0px_0px_0px_6px_var(--interactive-hover)] rounded-[2px] p-0"
                id={rightTitle.granularity}
                on:click={(event) =>
                    eventHandlers.onClick({
                        date: rightTitle.date,
                        createNewSplitLeaf: isControlPressed(event),
                        granularity: rightTitle.granularity,
                    })}
                on:contextmenu={(event) =>
                    eventHandlers.onContextMenu({
                        event,
                        fileData: rightTitle.fileData,
                        date: rightTitle.date,
                        granularity: rightTitle.granularity,
                    })}
                on:pointerenter={(event) => {
                    eventHandlers.onHover({
                        targetEl: event.target,
                        isControlPressed: isControlPressed(event),
                        file: rightTitle.fileData.file,
                    });
                }}
            >
                {rightTitle.date.format(rightTitle.formatValue)}
            </button>
        {/if}
    </div>

    <slot name="bottom-nav" />
</div>
