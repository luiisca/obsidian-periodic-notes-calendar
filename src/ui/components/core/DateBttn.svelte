<script lang="ts">
    import { IGranularity } from "@/io";

    import type { Moment } from "moment";

    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import {
        activeFilepathStore,
        displayedDateStore,
        todayStore,
        internalFileModStore,
    } from "@/stores/";
    import { cn, eventHandlers, isControlPressed } from "@/ui/utils";
    import Dot from "./Dot.svelte";
    import { getContext, Snippet } from "svelte";
    import { Sticker } from "..";

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

    let { date, granularity, displaySticker = true, displayDot = true, className = "", dotContainerClassName = "", children, text, ignoreAdjacentMonth = false, isActiveOverride = null}: Props = $props();

    let { file, sticker } = $derived.by(() => {
        $settingsStore; // crr file might have been deleted from settings page
        $internalFileModStore; // update on file rename or sticker update
        return getFileData(granularity, date);
    });
    let isActive = $derived(isActiveOverride ?? $activeFilepathStore === file?.path);
    let isToday = $derived(date.isSame($todayStore, granularity));
    let isAdjacentMonth = $state(false);

    $effect.pre(() => {
        if (ignoreAdjacentMonth) return;

        if (granularity === "day" && date && $displayedDateStore) {
            isAdjacentMonth = !date.isSame($displayedDateStore, "month");
        }
    });

    let minimalMode = getContext("minimalMode") as { value: boolean } | undefined;
</script>

<button
    class={cn(
        "relative !h-auto w-full flex flex-col font-medium rounded-[--radius-s] tabular-nums transition-colors text-center",
        isActive
            ? "!text-[--text-on-accent] !bg-[--interactive-accent] hover:!bg-[--interactive-accent-hover]"
            : isToday
              ? "!text-[--color-text-today]"
              : isAdjacentMonth
                ? "opacity-25"
                : "",
        isActive && isToday && "!text-[--text-on-accent]",
        className,
    )}
    onclick={(event) =>
        eventHandlers.onClick({
            date,
            createNewSplitLeaf: isControlPressed(event),
            granularity,
        })}
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
    <span class="relative">
        {#if displaySticker}
            <Sticker sticker={sticker?.emoji} />
        {/if}
        {@render children?.()}
    </span>
    {#if displayDot}
        <div class={cn(
            "absolute leading-[0]",
            dotContainerClassName
        )}>
            <Dot
                className={cn(minimalMode?.value && "w-1")}
                isVisible={!!file}
                isFilled={!!file}
                {isActive}
            />
        </div>
    {/if}
</button>
