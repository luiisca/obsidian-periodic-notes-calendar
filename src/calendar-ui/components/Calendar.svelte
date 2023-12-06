<script lang="ts">
	import { getMonth, getStartOfWeek, getYears, isMetaPressed, isWeekend } from '../utils';
	import { displayedDateStore, localeDataStore, settingsStore, yearsRanges } from '@/stores';
	import Day from './Day.svelte';
	import WeekNum from './WeekNum.svelte';
	import { monthsIndexesInQuarters, togglePeriods } from '@/constants';
	import { capitalize } from '@/utils';
	import MonthNav from './MonthNav.svelte';
	import YearNav from './YearNav.svelte';
	import YearsNav from './YearsNav.svelte';
	import QuarterNum from './QuarterNum.svelte';
	import Month from './Month.svelte';
	import Year from './Year.svelte';
	import clsx from 'clsx';

	$: ({
		localeSettings: { showWeekNums, showQuarterNums }
	} = $settingsStore);
	$: ({ weekdaysShort } = $localeDataStore);
	$: month = getMonth($displayedDateStore);

	let crrView: (typeof togglePeriods)[number] = 'days';
</script>

<div id="dailyflex-calendar-container" class="container font-['Inter'] px-4 !pt-2">
	<div
		class="flex rounded-[--tab-curve] ml-auto w-full max-w-xs space-x-1 p-1 bg-[--background-modifier-hover]"
		id="periods-container"
	>
		{#each togglePeriods as period}
			<button
				class={clsx(
					'[&:not(:focus-visible)]:shadow-none w-full rounded-[--radius-s] py-2 transition',
					crrView === period
						? 'text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover]'
						: 'text-[--tab-text-color] hover:text-[--text-on-accent]'
				)}
				id="period"
				on:click={() => (crrView = period)}>{capitalize(period)}</button
			>
		{/each}
	</div>
	{#if crrView === 'days'}
		<MonthNav />
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
							<WeekNum weekNum={week.weekNum} startOfWeekDate={getStartOfWeek(week.days)} />
						{/if}
						{#each week.days as day (day.format())}
							<Day date={day} />
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	{#if crrView === 'months'}
		<YearNav />
		<table class="calendar" id="calendar">
			<tbody>
				{#each monthsIndexesInQuarters as quarterMonthsIndexes, i}
					<tr>
						{#if showQuarterNums}
							<QuarterNum quarterNum={i + 1} />
						{/if}
						{#each quarterMonthsIndexes as monthIndex}
							<Month {monthIndex} />
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	{#if crrView === 'years'}
		<YearsNav />
		<table class="calendar" id="calendar">
			<tbody>
				{#each getYears( { startRangeYear: +$yearsRanges.ranges[$yearsRanges.crrRangeIndex].split('-')[0] } ) as rowYearsRange}
					<tr>
						{#each rowYearsRange as year}
							<Year {year} />
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	.container {
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

	.calendar {
		border-collapse: collapse;
		width: 100%;
		min-width: 100%;
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
