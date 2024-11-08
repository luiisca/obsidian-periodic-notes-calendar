<script lang="ts">
    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import { activeFilepathStore } from "@/stores";
    import { todayStore } from "@/stores/dates";
    import { Moment } from "moment";
    import { cn, eventHandlers, isControlPressed } from "../utils";
    import Dot from "./Dot.svelte";
    import Sticker from "./Sticker.svelte";

    interface Props {
        date: Moment;
    }

    let { date }: Props = $props();

    let { file, sticker } = $derived.by(() => {
        $settingsStore; // trigger reactivity
        return getFileData("year", date);
    });
    let isActive = $derived($activeFilepathStore === file?.path);
    let isToday = $derived(date.isSame($todayStore, "year"));
</script>

<td>
    <button
        class={cn(
            "relative !h-auto w-full flex flex-col font-medium rounded-[--radius-s] text-xl tracking-wide px-1 pt-2.5 pb-4 text-center tabular-nums transition-colors",
            isActive
                ? "!text-[--text-on-accent] !bg-[--interactive-accent] hover:!bg-[--interactive-accent-hover]"
                : isToday
                  ? "!text-[--color-text-today]"
                  : "",
            isActive && isToday && "!text-[--text-on-accent]",
        )}
        id="year"
        onclick={(event) =>
            eventHandlers.onClick({
                date,
                createNewSplitLeaf: isControlPressed(event),
                granularity: "year",
            })}
        oncontextmenu={(event) =>
            eventHandlers.onContextMenu({
                event,
                fileData: {
                    file,
                    sticker,
                },
                date,
                granularity: "year",
            })}
        onpointerenter={(event) => {
            eventHandlers.onHover({
                targetEl: event.target,
                isControlPressed: isControlPressed(event),
                file,
            });
        }}
    >
        {date.year()}
        <div
            class="absolute leading-[0] bottom-[calc(1rem/2)] translate-y-[35%]"
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
