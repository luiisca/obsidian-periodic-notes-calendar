<script lang="ts">
    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import {
        activeFilepathStore,
        displayedDateStore,
        internalFileModStore,
    } from "@/stores";
    import { todayStore } from "@/stores/dates";
    import { cn, eventHandlers, isControlPressed } from "../utils";
    import Dot from "./Dot.svelte";
    import Sticker from "./Sticker.svelte";
    import { Moment } from "moment";

    interface Props {
        date: Moment;
    }

    let { date }: Props = $props();

    let { file, sticker } = $derived.by(() => {
        $settingsStore; // crr file might have been deleted from settings page
        $internalFileModStore; // update on file rename or sticker update
        return getFileData("month", date);
    });
    let isActive = $derived($activeFilepathStore === file?.path);
    let isToday = $derived(date.isSame($todayStore, "month"));
    let monthIndex = date.month();
</script>

<td>
    <button
        class={cn(
            "relative !h-auto w-full flex flex-col items-center justify-center font-medium rounded-[--radius-s] text-base px-1 py-8 mb-3 text-center tabular-nums transition-colors",
            isActive
                ? "!text-[--text-on-accent] !bg-[--interactive-accent] hover:!bg-[--interactive-accent-hover]"
                : isToday
                  ? "!text-[--color-text-today]"
                  : "",
            isActive && isToday && "!text-[--text-on-accent]",
        )}
        id="month"
        onclick={(event) =>
            eventHandlers.onClick({
                date,
                createNewSplitLeaf: isControlPressed(event),
                granularity: "month",
            })}
        oncontextmenu={(event) =>
            eventHandlers.onContextMenu({
                event,
                fileData: {
                    file,
                    sticker,
                },
                date,
                granularity: "month",
            })}
        onpointerenter={(event) =>
            eventHandlers.onHover({
                targetEl: event.target,
                isControlPressed: isControlPressed(event),
                file,
            })}
    >
        <p
            class="text-5xl font-normal -z-10 opacity-15 text-[--text-muted] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
            {monthIndex < 9 ? "0" : ""}{monthIndex + 1}
        </p>
        <p>
            {$displayedDateStore.clone().month(monthIndex).format("MMM")}
        </p>
        <div
            class="absolute leading-[0] bottom-[calc(1.75rem/2)] translate-y-full"
        >
            <Dot isVisible={!!file} isFilled={!!file} {isActive} />
        </div>
    </button>
    <Sticker sticker={sticker?.emoji} />
</td>

<style lang="postcss">
    @tailwind base;
    @tailwind utilities;
</style>
