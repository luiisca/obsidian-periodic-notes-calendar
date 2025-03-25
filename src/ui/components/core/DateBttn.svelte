<script lang="ts">
    import { IGranularity } from "@/io";

    import type { Moment } from "moment";

    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import {
        activeFileStore,
        displayedDateStore,
        todayStore,
        internalFileModStore,
    } from "@/stores/";
    import { cn, eventHandlers, isControlPressed } from "@/ui/utils";
    import Dot from "./Dot.svelte";
    import { getContext, Snippet } from "svelte";
    import { Sticker } from "..";
    import { Platform } from "obsidian";

    interface Props {
        // Properties
        date: Moment;
        granularity: IGranularity;
        isActiveOverride?: boolean | null;
        displaySticker?: boolean;
        displayDot?: boolean;
        className?: string;
        dotContainerClassName?: string;
        children?: Snippet;
        text?: Snippet;
        ignoreAdjacentMonth?: boolean;
    }

    let {
        date,
        granularity,
        displaySticker = true,
        displayDot = true,
        className = "",
        dotContainerClassName = "",
        children,
        text,
        ignoreAdjacentMonth = false,
        isActiveOverride = null,
    }: Props = $props();

    let { file, sticker } = $derived.by(() => {
        $settingsStore; // crr file might have been deleted from settings page
        $internalFileModStore; // update on file rename or sticker update
        return getFileData(granularity, date);
    });
    let isActive = $derived.by(() => {
        if (!$activeFileStore?.file?.path || !file?.path) {
            return false;
        }

        return isActiveOverride ?? $activeFileStore.file.path === file.path;
    });

    let isToday = $derived(date.isSame($todayStore, granularity));
    let isAdjacentMonth = $state(false);

    $effect.pre(() => {
        if (ignoreAdjacentMonth) return;

        if (granularity === "day" && date && $displayedDateStore) {
            isAdjacentMonth = !date.isSame($displayedDateStore, "month");
        }
    });

    let minimalMode = getContext("minimalMode") as
        | { value: boolean }
        | undefined;
</script>

<button
    id={`${granularity}-bttn`}
    class={cn(
        "date-bttn",
        "relative !h-auto w-full flex flex-col font-medium rounded-[--radius-s] tabular-nums transition-colors text-center",
        isActive
            ? "!text-[--text-on-accent]"
            : isToday
              ? "!text-[--color-text-today]"
              : isAdjacentMonth
                ? "opacity-25"
                : "",
        isActive && isToday && "!text-[--text-on-accent]",
        className,
    )}
    class:isActive
    style={`
        background-color: var(--color-background-${granularity}-bttn);
        color: var(--color-text-${granularity}-bttn);
    `}
    onclick={(event) => {
        eventHandlers.onClick({
            date,
            createNewSplitLeaf: isControlPressed(event),
            granularity,
        });
    }}
    oncontextmenu={(event) =>
        eventHandlers.onContextMenu({
            event,
            fileData: {
                file,
                sticker,
            },
            date,
            granularity,
        })}
    onpointerenter={(event) => {
        eventHandlers.onHover({
            event,
            isControlPressed: isControlPressed(event),
            file,
        });
    }}
>
    {@render text?.()}
    <span id="date-text" class="relative">
        {#if displaySticker}
            <Sticker sticker={sticker?.emoji} />
        {/if}
        {@render children?.()}
    </span>
    {#if displayDot}
        <div class={cn("absolute leading-[0]", dotContainerClassName)}>
            <Dot
                className={cn(
                    (minimalMode?.value || Platform.isPhone) && "w-1",
                )}
                isVisible={!!file}
                isFilled={!!file}
                {isActive}
            />
        </div>
    {/if}
</button>

<style lang="postcss">
    button:hover {
        @apply hover:!bg-[var(--interactive-hover)];
    }
    button.isActive {
        @apply !bg-[--interactive-accent];
    }
    button.isActive:hover {
        @apply hover:!bg-[--interactive-accent-hover];
    }
</style>
