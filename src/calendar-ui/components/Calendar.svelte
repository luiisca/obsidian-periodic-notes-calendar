<script lang="ts">
	import weekOfYear from 'dayjs/plugin/weekOfYear';
	import isoWeek from 'dayjs/plugin/isoWeek';

	window.dayjs.extend(weekOfYear);
	window.dayjs.extend(isoWeek);

	import { getContext } from 'svelte';

	import { VIEW } from '../context';
	import { getMonth, getStartOfWeek, getYears, isMetaPressed, isWeekend } from '../utils';
	import {
		displayedDateStore,
		notesStores,
		rerenderStore,
		settingsStore,
		yearsRanges
	} from '@/stores';
	import type { ICalendarViewCtx } from '@/view';
	import Day from './Day.svelte';
	import WeekNum from './WeekNum.svelte';
	import { granularities, monthsIndexesInQuarters, togglePeriods } from '@/constants';
	import { capitalize } from '@/utils';
	import MonthNav from './MonthNav.svelte';
	import YearNav from './YearNav.svelte';
	import YearsNav from './YearsNav.svelte';
	import Dot from './Dot.svelte';
	import { getNoteByGranularity } from '@/calendar-io';
	import QuarterNum from './QuarterNum.svelte';
	import Month from './Month.svelte';
	import Year from './Year.svelte';

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	$: ({
		localeData: { showWeekNums, localizedWeekdaysShort }
	} = $settingsStore);
	$: month = getMonth($displayedDateStore);
	$: $settingsStore, reindexNotes();

	let crrView: (typeof togglePeriods)[number] = 'days';

	const reindexNotes = () => {
		granularities.forEach((granularity) => {
			notesStores[granularity].reindex();
		});
	};
</script>

<div id="calendar-container" class="container">
	<!-- TODO: replace tw colors with theme variables -->
	<div class="flex rounded-md space-x-1 p-1 w-full">
		{#each togglePeriods as period}
			<button
				class={`w-full cursor-pointer rounded-md px-4 py-2 text-black ${
					crrView === period ? 'bg-gray-100' : 'text-white'
				}`}
				on:click={() => (crrView = period)}>{capitalize(period)}</button
			>
		{/each}
	</div>
	{#if crrView === 'days'}
		<MonthNav />
		<table class="calendar">
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
					{#each localizedWeekdaysShort as dayOfWeek}
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
		<table class="calendar">
			<tbody>
				{#each monthsIndexesInQuarters as quarterMonthsIndexes, i}
					<tr>
						{#if showWeekNums}
							<QuarterNum quarterNum={i + 1} />
						{/if}
						{#each quarterMonthsIndexes as monthIndex}
							<Month monthIndex={monthIndex} />
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	{#if crrView === 'years'}
		<YearsNav />
		<table class="calendar">
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

	.container {
		padding: 0 8px;
	}

	.weekend {
		background-color: var(--color-background-weekend);
	}

	.calendar {
		border-collapse: collapse;
		width: 100%;
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
