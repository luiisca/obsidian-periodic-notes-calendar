<script lang="ts">
    import type { Moment } from "moment";

    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import { activeFilepathStore, todayStore } from "@/stores/";
    import { cn, eventHandlers, isControlPressed } from "../utils";
    import Dot from "./Dot.svelte";
    import Sticker from "./Sticker.svelte";

    interface Props {
        // Properties
        date: Moment;
    }

    let { date }: Props = $props();

    let { file, sticker } = $derived.by(() => {
        $settingsStore; // trigger reactivity
        return getFileData("week", date);
    });
    let isActive = $derived($activeFilepathStore === file?.path);
    let isToday = $derived(date.isSame($todayStore, "week"));
</script>

<td class="[border-right:1px_solid_var(--background-modifier-border)] pr-1">
    <button
        class={cn(
            "relative !h-auto w-full flex flex-col font-medium rounded-[--radius-s] [font-size:var(--font-ui-small)] opacity-85 px-1 pt-2.5 pb-4 mx-auto text-center tabular-nums transition-colors",
            isActive
                ? "!text-[--text-on-accent] !bg-[--interactive-accent] hover:!bg-[--interactive-accent-hover]"
                : isToday
                  ? "!text-[--color-text-today]"
                  : "",
            isActive && isToday && "!text-[--text-on-accent]",
        )}
        onclick={(event) =>
            eventHandlers.onClick({
                date,
                createNewSplitLeaf: isControlPressed(event),
                granularity: "week",
            })}
        oncontextmenu={(event) =>
            eventHandlers.onContextMenu({
                event,
                fileData: {
                    file,
                    sticker,
                },
                date,
                granularity: "week",
            })}
        onpointerenter={(event) => {
            eventHandlers.onHover({
                targetEl: event.target,
                isControlPressed: isControlPressed(event),
                file,
            });
        }}
    >
        {date.week()}
        <div class="absolute leading-[0] bottom-[calc(1rem/2)] translate-y-1/3">
            <Dot isVisible={!!file} isFilled={!!file} {isActive} />
        </div>
    </button>
    <Sticker sticker={sticker?.emoji} />
</td>
