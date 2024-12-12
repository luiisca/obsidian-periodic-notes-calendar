<script lang="ts">
    import type { Moment } from "moment";
    import { fly } from "svelte/transition";

    import { IGranularity } from "@/io";
    import { settingsStore, TimelineViewMode } from "@/settings";
    import { localeSwitched, previewSplitPositionStore } from "@/stores";
    import { Arrow, Dot } from "@/ui";
    import {
        cn,
        eventHandlers,
        getRelativeDate,
        isControlPressed,
    } from "@/ui/utils";
    import { setIcon } from "obsidian";
    import { onDestroy, onMount } from "svelte";
    import DateBttn from "../core/DateBttn.svelte";
    import { G_MAP, VIEW_MODES } from "./constants";

    interface Props {
        granularity: IGranularity;
        date: Moment;
        isPeriodic?: boolean | null;
        isPreview?: boolean | null;
        viewModeOverride?: TimelineViewMode | null;
    }
    const {
        granularity,
        date,
        viewModeOverride = "collapsed",
        isPeriodic = null,
        isPreview = null,
    }: Props = $props();
    let timelineEl: HTMLDivElement | null = $state(null);
    let arrowEl: HTMLDivElement | null = $state(null);

    let viewMode = $state(viewModeOverride);
    const derivedG = $derived(
        $settingsStore.timeline.granularityBased ? granularity : "day",
    );

    let crrDisplayedDate = $state(date);
    $effect.pre(() => {
        $localeSwitched;
        // this is crucial, existing moment objects keep their existing locale, so we need to re-locale them
        crrDisplayedDate = crrDisplayedDate.locale(window.moment.locale());
    });
    let crrSelectedDate = $state(date);
    const relativeFormattedDate = $derived.by(() => {
        $localeSwitched;
        return getRelativeDate(derivedG, crrDisplayedDate);
    });
    let dates: Moment[] = $derived.by(() => {
        $localeSwitched;

        let dates: Moment[] = [];

        if (derivedG === "week") {
            function getWeeksInMonth() {
                const weeks = [];
                const date = window.moment([
                    crrDisplayedDate.year(),
                    crrDisplayedDate.month(),
                    1,
                ]);
                let startOfWeek = date.clone().startOf("week");
                const endOfMonth = date.clone().endOf("month");

                while (startOfWeek.isBefore(endOfMonth)) {
                    weeks.push(startOfWeek.clone());
                    startOfWeek = startOfWeek.add(1, "week");
                }

                return weeks;
            }

            dates = getWeeksInMonth();
            return dates;
        }

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

    let isInitial = $derived(date.isSame(crrDisplayedDate, derivedG));
    let observer: ResizeObserver | null = $state(null);
    let prevParentWidth: number | null = $state(null);

    function modDisplayedDate(ev: MouseEvent, type: "subtract" | "add") {
        ev.stopPropagation();
        crrDisplayedDate = crrDisplayedDate
            .clone()
            .startOf(derivedG)
            [type](G_MAP[derivedG].mod, G_MAP[derivedG].group);
    }
    function handleResetDate(event: MouseEvent) {
        event.stopPropagation();
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
    function handleToggleViewMode() {
        const crrViewModeIndex = VIEW_MODES.findIndex((m) => m === viewMode);
        viewMode = VIEW_MODES[(crrViewModeIndex + 1) % VIEW_MODES.length];
    }

    $effect.pre(() => {
        if (arrowEl) {
            setIcon(
                arrowEl,
                viewMode === "collapsed"
                    ? "lucide-chevron-right"
                    : "lucide-chevron-up",
            );
        }
    });

    onMount(() => {
        prevParentWidth =
            timelineEl?.parentElement?.getBoundingClientRect()?.width || 0;
        const cb = () => {
            const isParentActive =
                (timelineEl?.parentElement?.offsetHeight || 0) > 0 &&
                (timelineEl?.parentElement?.offsetWidth || 0) > 0;
            if (isParentActive) {
                const parentSize =
                    timelineEl?.parentElement?.getBoundingClientRect();

                const enoughRoomInParent = (parentSize?.width || 0) > 640;

                if (prevParentWidth === null) {
                    prevParentWidth = parentSize?.width || 0;
                    return;
                }

                if (prevParentWidth < 660 && enoughRoomInParent) {
                    viewMode = isPeriodic
                        ? $settingsStore.timeline.viewMode
                        : $settingsStore.timeline.restViewMode;
                } else if (prevParentWidth >= 620 && !enoughRoomInParent) {
                    viewMode = enoughRoomInParent ? "expanded" : "collapsed";
                }
                prevParentWidth = parentSize?.width || 0;
            }
        };
        observer = new ResizeObserver(cb);
        timelineEl?.parentElement && observer.observe(timelineEl.parentElement);
    });

    onDestroy(() => {
        if (observer) {
            observer.disconnect();
        }
    });
</script>

<div
    class={cn(
        "pnc-container absolute right-[26px] z-10 flex gap-[0.15rem] flex-col",
        isPreview &&
            ($previewSplitPositionStore === "right" ||
                $previewSplitPositionStore === "left")
            ? "top-[26px] bg-[var(--background-secondary)]"
            : "top-[56px] bg-[var(--background-primary)]",
    )}
    bind:this={timelineEl}
    id={`timeline-container-${granularity}`}
>
    {#if viewMode === "expanded"}
        <div
            class={cn(
                "flex gap-1.5 [border-bottom:1px_solid_var(--divider-color)] pb-1.5",
                derivedG === "year" ? "flex-col" : "flex-row",
            )}
            in:fly={{ x: 8 }}
            out:fly={{ x: 8 }}
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
    {/if}
    <div
        tabindex="0"
        role="button"
        class={cn(
            "absolute cursor-pointer flex justify-end items-center pl-1 transition-all duration-400 ease-out right-0 w-auto",
            "rounded-[var(--radius-s)]",
            viewMode === "collapsed"
                ? "top-0 px-1.5 pl-1 py-[0.3rem]"
                : "top-[calc(100%+0.15rem)]",
            viewMode === "expanded" &&
                (derivedG === "day" || derivedG === "year") &&
                "w-full",
            isPreview &&
                ($previewSplitPositionStore === "right" ||
                    $previewSplitPositionStore === "left")
                ? "bg-[var(--background-secondary)] hover:bg-[var(--color-base-25)]"
                : "bg-[var(--background-primary)] hover:bg-[var(--color-base-10)]",
        )}
        onclick={handleToggleViewMode}
        onkeydown={handleToggleViewMode}
    >
        <div class="flex items-center gap-1 mr-auto">
            <div
                class="flex text-[var(--text-accent)]"
                bind:this={arrowEl}
            ></div>
            <p
                class="m-0 flex items-center text-[var(--text-accent)] [font-size:var(--font-smallest)] font-semibold tracking-[0.4px] whitespace-nowrap"
            >
                {relativeFormattedDate}
            </p>
        </div>

        {#if viewMode === "expanded"}
            <div class="flex items-center ml-1 h-fit" id="bottom-nav">
                <Arrow
                    direction="left"
                    onClick={(ev) => {
                        modDisplayedDate(ev, "subtract");
                    }}
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
                    aria-label={`Go to note's ${G_MAP[derivedG].group}`}
                    data-tooltip-delay="200"
                >
                    <Dot
                        className="h-[0.3rem] w-[0.3rem]"
                        isFilled={isInitial}
                    />
                </button>
                <Arrow
                    direction="right"
                    onClick={(ev) => modDisplayedDate(ev, "add")}
                    tooltip={`Next ${G_MAP[derivedG].group}`}
                    className="[&>svg]:w-1.5"
                />
            </div>
        {/if}
    </div>
</div>
