<script lang="ts">
    import { monthsIndexesInQuarters, togglePeriods } from "@/constants";
    import { settingsStore } from "@/settings";
    import { displayedDateStore, localeDataStore, yearsRanges } from "@/stores";
    import { getContext } from "svelte";
    import {
        cn,
        getMonth,
        getStartOfWeek,
        getYears,
        isWeekend,
    } from "../utils";
    import MonthHeader from "./MonthHeader.svelte";
    import YearHeader from "./YearHeader.svelte";
    import YearsHeader from "./YearsHeader.svelte";
    import { Tabs } from "./core";
    import DateBttn from "./core/DateBttn.svelte";

    let {
        localeSettings: { showWeekNums, showQuarterNums },
    } = $derived($settingsStore);
    let { weekdaysShort } = $derived($localeDataStore);
    let month = $derived(getMonth($displayedDateStore));

    let crrView: (typeof togglePeriods)[number] = $state("day");
    let minimalMode = getContext("minimalMode") as { value: boolean } | undefined;
</script>

<div class="pnc-container px-4 !pt-2">
    <Tabs
        tabs={[...togglePeriods]}
        bind:selectedTab={crrView}
        id="periods-container"
        tabId="period"
        className="mx-0 ml-auto"
    />

    {#if crrView === "day"}
        <MonthHeader />
        <table class="pnc-calendar">
            <colgroup>
                {#if showWeekNums}
                    <col />
                {/if}
                {#each month[1].days as date}
                    <col class:weekend={isWeekend(date)} />
                {/each}
            </colgroup>
            <thead>
                <tr>
                    {#if showWeekNums}
                        <th>W</th>
                    {/if}
                    {#each weekdaysShort as dayOfWeek}
                        <th>{dayOfWeek}</th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each month as week (week.weekNum)}
                    <tr>
                        {#if showWeekNums}
                            <td
                                class="[border-right:1px_solid_var(--background-modifier-border)] pr-1"
                            >
                                <DateBttn
                                    date={getStartOfWeek(week.days)}
                                    granularity="week"
                                    className={cn(
                                        "px-1 pt-2.5 pb-4 opacity-85 mx-auto",
                                        minimalMode?.value
                                            ? "[font-size:var(--font-ui-smaller)] "
                                            : "[font-size:var(--font-ui-small)] ",
                                    )}
                                    dotContainerClassName={"bottom-[calc(1rem/2)] translate-y-1/3"}
                                >
                                    {getStartOfWeek(week.days).week() < 10 ? "0" : ""}{getStartOfWeek(week.days).week()}
                                </DateBttn>
                            </td>
                        {/if}
                        {#each week.days as day (day.format())}
                            <td
                                class={cn(
                                    $settingsStore.localeSettings
                                        .showWeekNums &&
                                        "[&:nth-child(2)]:pl-1",
                                )}
                            >
                                <DateBttn
                                    date={day}
                                    granularity="day"
                                    className={cn(
                                        "px-1 pt-2.5 pb-4",
                                        minimalMode?.value
                                            ? "text-xs"
                                            : "text-sm",
                                    )}
                                    dotContainerClassName={"bottom-[calc(1rem/2)] translate-y-1/3"}
                                >
                                    {day.format("D")}
                                </DateBttn>
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
    {#if crrView === "month"}
        <YearHeader />
        <table class="pnc-calendar">
            <tbody>
                {#each monthsIndexesInQuarters as quarterMonthsIndexes, i}
                    <tr>
                        {#if showQuarterNums}
                            <td>
                                <DateBttn
                                    date={$displayedDateStore
                                        .clone()
                                        .quarter(i + 1)
                                        .startOf("quarter")}
                                    granularity='quarter'
                                    className={cn(
                                        "px-1 pt-2.5 pb-4 opacity-85",
                                        minimalMode?.value
                                            ? "[font-size:var(--font-ui-smaller)]"
                                            : "[font-size:var(--font-ui-small)] ",
                                    )}
                                    dotContainerClassName="bottom-[calc(1rem/2)] translate-y-1/3"
                                >
                                    Q{$displayedDateStore
                                        .clone()
                                        .quarter(i + 1)
                                        .startOf("quarter").quarter()}
                                </DateBttn>
                            </td>
                        {/if}
                        {#each quarterMonthsIndexes as monthIndex}
                            <td>
                                <DateBttn
                                    date={$displayedDateStore
                                        .clone()
                                        .month(monthIndex)
                                        .startOf("month")}
                                    granularity="month"
                                    className={cn(
                                        "px-1 mb-3 items-center justify-center",
                                        minimalMode?.value
                                            ? "text-sm pt-2.5 pb-4"
                                            : "text-base py-8",
                                    )}
                                    dotContainerClassName={cn(
                                        "translate-y-full",
                                        minimalMode?.value ? "bottom-[calc(1rem/2)]" : "bottom-[calc(1.75rem/2)]"
                                    )}
                                >
                                        {#snippet text()}
                                            {#if !minimalMode?.value}
                                                <p
                                                    class="text-5xl font-normal opacity-15 text-[--text-muted] absolute top-1/2 left-1/2 [transform:translate(-50%,-50%)] m-0"
                                                >
                                                    {monthIndex < 9 ? "0" : ""}{monthIndex + 1}
                                                </p>
                                            {/if}
                                        {/snippet}
                                    {$displayedDateStore
                                        .clone()
                                        .month(monthIndex)
                                        .format("MMM")}
                                </DateBttn>
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
    {#if crrView === "year"}
        <YearsHeader />
        <table class="pnc-calendar">
            <tbody>
                {#each getYears( { startRangeYear: +$yearsRanges.ranges[$yearsRanges.crrRangeIndex].split("-")[0] }, ) as rowYearsRange}
                    <tr>
                        {#each rowYearsRange as year}
                            <td>
                                <DateBttn
                                    date={$displayedDateStore
                                        .clone()
                                        .year(year)
                                        .startOf("year")}
                                    granularity="year"
                                    className={cn(
                                        "tracking-wide px-1 pt-2.5 pb-4",
                                        minimalMode?.value
                                            ? "text-base"
                                            : "text-xl",
                                    )}
                                    dotContainerClassName="bottom-[calc(1rem/2)] translate-y-[35%]"
                                >
                                    {$displayedDateStore
                                    .clone()
                                    .year(year)
                                    .startOf("year").year()}
                                </DateBttn>
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>

<style lang="postcss">
    .pnc-container {
        --color-background-heading: transparent;
        --color-background-day: transparent;
        --color-background-weeknum: transparent;
        --color-background-weekend: transparent;

        --color-dot: var(--text-muted);
        --color-arrow: var(--text-muted);
        --color-button: var(--text-muted);

        --color-text-title: var(--text-normal);
        --color-text-heading: var(--text-muted);
        --color-text-day: var(--text-normal);
        --color-text-today: var(--interactive-accent);
        --color-text-weeknum: var(--text-muted);
    }

    .weekend {
        background-color: var(--color-background-weekend);
    }

    .pnc-calendar {
        border-collapse: collapse;
        width: calc(100% + 2rem);
        min-width: 100%;
        margin-left: -1rem;
    }

    th {
        background-color: var(--color-background-heading);
        color: var(--color-text-heading);
        font-size: 0.6em;
        letter-spacing: 1px;
        padding: 4px;
        text-align: center;
        text-transform: uppercase;
    }
</style>
