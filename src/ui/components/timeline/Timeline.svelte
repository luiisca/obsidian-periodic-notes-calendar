<script lang="ts">
    import type { Moment } from "moment";

    import { IGranularity } from "@/io";
    import { settingsStore } from "@/settings";
    import { Arrow, Dot } from "@/ui";
    import {
        cn,
        eventHandlers,
        getRelativeDate,
        isControlPressed,
    } from "@/ui/utils";
    import { capitalize } from "@/utils";
    import DateBttn from "../core/DateBttn.svelte";
    import { G_MAP } from "./constants";

    interface Props {
        granularity: IGranularity;
        date: Moment;
    }
    const { granularity, date }: Props = $props();
    let timelineEl: HTMLDivElement | null = $state(null);
    export { timelineEl as timelineEl };
    export function getTimelineEl() {
        return timelineEl;
    }

    const derivedG = $derived(
        $settingsStore.timeline.granularityBased ? granularity : "day",
    );
    let crrDisplayedDate = $state(date);
    let crrSelectedDate = $state(date);
    const relativeFormattedDate = $derived(
        getRelativeDate(derivedG, crrDisplayedDate),
    );
    let isInitial = $derived(date.isSame(crrDisplayedDate, derivedG));
    let dates: Moment[] = $derived.by(() => {
        let dates: Moment[] = [];
        let startOfDate: Moment = crrDisplayedDate;
        if (derivedG === "year") {
            startOfDate = crrDisplayedDate.clone().subtract(2, "year");
        } else {
            startOfDate = crrDisplayedDate
                .clone()
                .startOf(G_MAP[derivedG].group);
        }
        let dateIter = startOfDate.clone();
        for (let i = 0; i < G_MAP[derivedG].qtt; i++) {
            dates.push(dateIter.clone());
            dateIter = dateIter.add(1, derivedG);
        }

        return dates;
    });
    let startOfDate = $derived(dates[0]);
    let endOfDate = $derived(dates[dates.length - 1]);

    function modDisplayedDate(type: "subtract" | "add") {
        crrDisplayedDate = crrDisplayedDate
            .clone()
            [type](G_MAP[derivedG].mod, G_MAP[derivedG].group);
    }
    function handleResetDate(event: MouseEvent) {
        crrDisplayedDate = date;
        crrSelectedDate = date;
        eventHandlers.onClick({
            date,
            createNewSplitLeaf: isControlPressed(event),
            granularity,
        });
    }
    function handleSelectDate(d: Moment) {
        crrSelectedDate = d;
    }
</script>

<div
    class="pnc-container bg-[var(--background-primary)] absolute top-[56px] right-[26px] z-10 flex gap-[0.15rem] flex-col items-end"
    bind:this={timelineEl}
    id={`timeline-container-${granularity}`}
>
    <div
        class={cn(
            "flex gap-1.5",
            derivedG === "year" ? "flex-col" : "flex-row",
        )}
    >
        {#if derivedG !== "day"}
            <div
                class={cn(
                    "flex items-center text-[0.7em] text-center pt-0.5",
                    derivedG === "year" && "justify-center",
                )}
            >
                {#if derivedG === "year" && startOfDate && endOfDate}
                    {startOfDate
                        .clone()
                        .format(G_MAP.year.titleFormat)}-{endOfDate.format(
                        G_MAP.year.titleFormat,
                    )}
                {:else}
                    {crrDisplayedDate.format(G_MAP[derivedG].titleFormat)}
                {/if}
            </div>
        {/if}
        <div class="flex gap-0.5">
            {#each dates as d}
                <div class="flex flex-col gap-0.5 text-center">
                    {#if derivedG === "day"}
                        <div
                            class={cn(
                                "text-[0.7em] font-semibold tracking-[0.2px] text-[var(--text-muted)]",
                                d.isSame(crrSelectedDate, "day") &&
                                    "text-[var(--text-normal)]",
                            )}
                        >
                            {d.format(G_MAP[derivedG].titleFormat)}
                        </div>
                    {/if}
                    <div
                        tabindex="0"
                        role="button"
                        onclick={() => handleSelectDate(d)}
                        onkeydown={() => handleSelectDate(d)}
                    >
                        <DateBttn
                            date={d}
                            granularity={derivedG}
                            isActiveOverride={d.isSame(
                                crrSelectedDate,
                                derivedG,
                            )}
                            displaySticker={false}
                            displayDot={false}
                            className="p-1.5 text-xs"
                            ignoreAdjacentMonth={true}
                        >
                            {d.format(G_MAP[derivedG].format)}
                        </DateBttn>
                    </div>
                </div>
            {/each}
        </div>
    </div>
    <div class="flex justify-between items-center w-full pl-1">
        <p
            class="m-0 mr-3 flex items-center text-[var(--text-accent)] [font-size:var(--font-smallest)] font-semibold tracking-[0.4px]"
        >
            {relativeFormattedDate}
        </p>

        <div class="flex items-center -ml-2 h-fit" id="bottom-nav">
            <Arrow
                direction="left"
                onClick={() => modDisplayedDate("subtract")}
                tooltip={`Previous ${G_MAP[derivedG].group}`}
                className="[&>svg]:w-1.5"
            />
            <button
                class={cn(
                    "text-[--color-arrow] flex items-center p-1.5",
                    isInitial ? "opacity-100" : "opacity-60",
                )}
                id="reset-button"
                onclick={handleResetDate}
                aria-label={!isInitial
                    ? `Go to Current ${capitalize(G_MAP[derivedG].group)}`
                    : null}
            >
                <Dot className="h-[0.3rem] w-[0.3rem]" isFilled={isInitial} />
            </button>
            <Arrow
                direction="right"
                onClick={() => modDisplayedDate("add")}
                tooltip={`Next ${G_MAP[derivedG].group}`}
                className="[&>svg]:w-1.5"
            />
        </div>
    </div>
</div>
