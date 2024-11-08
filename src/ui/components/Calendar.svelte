<script lang="ts">
    import { Picker } from "emoji-mart";

    import { monthsIndexesInQuarters, togglePeriods } from "@/constants";
    import { settingsStore } from "@/settings";
    import { displayedDateStore, localeDataStore, yearsRanges } from "@/stores";
    import { getMonth, getStartOfWeek, getYears, isWeekend } from "../utils";
    import Day from "./Day.svelte";
    import Month from "./Month.svelte";
    import MonthHeader from "./MonthHeader.svelte";
    import QuarterNum from "./QuarterNum.svelte";
    import Tabs from "./Tabs.svelte";
    import WeekNum from "./WeekNum.svelte";
    import Year from "./Year.svelte";
    import YearHeader from "./YearHeader.svelte";
    import YearsHeader from "./YearsHeader.svelte";

    let {
        localeSettings: { showWeekNums, showQuarterNums },
    } = $derived($settingsStore);
    let { weekdaysShort } = $derived($localeDataStore);
    let month = $derived(getMonth($displayedDateStore));

    let crrView: (typeof togglePeriods)[number] = $state("day");
</script>

<div class="container px-4 !pt-2" id="container">
    <Tabs
        tabs={[...togglePeriods]}
        bind:selectedTab={crrView}
        id="periods-container"
        tabId="period"
        className="mx-0 ml-auto"
    />

    {#if crrView === "day"}
        <MonthHeader />
        <table class="calendar" id="calendar">
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
                            <!-- on:hoverDay={updatePopover}
							on:endHoverDay={dismissPopover} -->
                            <WeekNum date={getStartOfWeek(week.days)} />
                        {/if}
                        {#each week.days as day (day.format())}
                            <Day date={day} />
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
    {#if crrView === "month"}
        <YearHeader />
        <table class="calendar" id="calendar">
            <tbody>
                {#each monthsIndexesInQuarters as quarterMonthsIndexes, i}
                    <tr>
                        {#if showQuarterNums}
                            <QuarterNum
                                date={$displayedDateStore
                                    .clone()
                                    .quarter(i + 1)
                                    .startOf("quarter")}
                            />
                        {/if}
                        {#each quarterMonthsIndexes as monthIndex}
                            <Month
                                date={$displayedDateStore
                                    .clone()
                                    .month(monthIndex)
                                    .startOf("month")}
                            />
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
    {#if crrView === "year"}
        <YearsHeader />
        <table class="calendar" id="calendar">
            <tbody>
                {#each getYears( { startRangeYear: +$yearsRanges.ranges[$yearsRanges.crrRangeIndex].split("-")[0] }, ) as rowYearsRange}
                    <tr>
                        {#each rowYearsRange as year}
                            <Year
                                date={$displayedDateStore
                                    .clone()
                                    .year(year)
                                    .startOf("year")}
                            />
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>
<button
    onclick={() => {
        console.log("Picker", Picker);
        const pickerEl = new Picker({ onEmojiSelect: console.log });
        console.log(pickerEl);
    }}>Picker</button
>

<style lang="postcss">
    #container {
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

    #calendar {
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
