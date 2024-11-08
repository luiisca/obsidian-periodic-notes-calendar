<script lang="ts">
    import type { Moment } from "moment";

    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import {
        activeFilepathStore,
        displayedDateStore,
        todayStore,
    } from "@/stores/";
    import { cn } from "@/ui/utils";
    import { eventHandlers, isControlPressed } from "../utils";
    import Dot from "./Dot.svelte";
    import Sticker from "./Sticker.svelte";

    interface Props {
        // Properties
        date: Moment;
    }

    let { date }: Props = $props();

    let { file, sticker } = $derived.by(() => {
        $settingsStore; // trigger reactivity
        return getFileData("day", date);
    });
    let isActive = $derived($activeFilepathStore === file?.path);
    let isToday = $derived(date.isSame($todayStore, "day"));
    let isAdjacentMonth = $derived(!date.isSame($displayedDateStore, "month"));
</script>

<td
    class={cn(
        $settingsStore.localeSettings.showWeekNums && "[&:nth-child(2)]:pl-1",
    )}
>
    <button
        class={cn(
            "relative !h-auto w-full flex flex-col font-medium rounded-[--radius-s] text-sm px-1 pt-2.5 pb-4 text-center tabular-nums transition-colors",
            isActive
                ? "!text-[--text-on-accent] !bg-[--interactive-accent] hover:!bg-[--interactive-accent-hover]"
                : isToday
                  ? "!text-[--color-text-today]"
                  : isAdjacentMonth
                    ? "opacity-25"
                    : "",
            isActive && isToday && "!text-[--text-on-accent]",
        )}
        id="day"
        onclick={(event) =>
            eventHandlers.onClick({
                date,
                createNewSplitLeaf: isControlPressed(event),
                granularity: "day",
            })}
        oncontextmenu={(event) =>
            eventHandlers.onContextMenu({
                event,
                fileData: {
                    file,
                    sticker,
                },
                date,
                granularity: "day",
            })}
        onpointerenter={(event) => {
            eventHandlers.onHover({
                targetEl: event.target,
                isControlPressed: isControlPressed(event),
                file,
            });
        }}
    >
        {date.format("D")}
        <div class="absolute leading-[0] bottom-[calc(1rem/2)] translate-y-1/3">
            <Dot isVisible={!!file} isFilled={!!file} {isActive} />
        </div>
    </button>
    <Sticker sticker={sticker?.emoji} />
</td>

