<script lang="ts">
	import weekOfYear from 'dayjs/plugin/weekOfYear';
	import isoWeek from 'dayjs/plugin/isoWeek';

	window.dayjs.extend(weekOfYear);
	window.dayjs.extend(isoWeek);

	import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';

	import { DISPLAYED_DATE, IS_MOBILE, VIEW } from '../context';
	// import PopoverMenu from "./popover/PopoverMenu.svelte";
	// import Day from './Day.svelte';
	// import Nav from './Nav.svelte';
	// import WeekNum from './WeekNum.svelte';
	import { getMonth, getStartOfWeek, getYears, isMetaPressed, isWeekend } from '../utils';
	import { notesStores, settingsStore, yearsRanges } from '@/stores';
	import type { CalendarView, ICalendarViewCtx } from '@/view';
	import Day from './Day.svelte';
	import WeekNum from './WeekNum.svelte';
	import { granularities, monthsIndexesInQuarters, togglePeriods } from '@/constants';
	import type { Moment } from 'moment';
	import { capitalize } from '@/utils';
	import MonthNav from './MonthNav.svelte';
	import YearNav from './YearNav.svelte';
	import YearsNav from './YearsNav.svelte';

	const { app, eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	$: ({
		localeData: { showWeekNums, localizedWeekdaysShort }
	} = $settingsStore);

	let displayedDate = writable<Moment>(window.moment());
	setContext(DISPLAYED_DATE, displayedDate);

	$: month = getMonth($displayedDate);

	let crrView: (typeof togglePeriods)[number] = 'days';

	// let hoverTimeout: number;
	// let showPopover: boolean = false;
	// let popoverMetadata: IDayMetadata[];
	// let hoveredDay = writable<HTMLElement>(null);

	// const fileCache = new PeriodicNotesCache(plugin);

	// function openPopover() {
	//   showPopover = true;
	// }

	// function updatePopover(event: CustomEvent) {
	//   const { metadata, target } = event.detail;

	//   if (!showPopover) {
	//     window.clearTimeout(hoverTimeout);
	//     hoverTimeout = window.setTimeout(() => {
	//       if ($hoveredDay === target) {
	//         openPopover(); }
	//     }, 750);
	//   }

	//   if ($hoveredDay !== target) {
	//     hoveredDay.set(target);
	//     popoverMetadata = metadata;
	//   }
	// }

	// const dismissPopover = debounce(
	//   (event: CustomEvent) => {
	//     // if the user didn't hover onto another day
	//     if ($hoveredDay === event.detail.target) {
	//       hoveredDay.set(null);
	//       showPopover = false;
	//     }
	//   },
	//   250,
	//   true
	// );

	$: $settingsStore, reindexNotes();

	const reindexNotes = () => {
		granularities.forEach((granularity) => {
			notesStores[granularity].reindex();
		});
	};
</script>

<div id="calendar-container" class="container">
	<!-- on:hoverDay={updatePopover}
		on:endHoverDay={dismissPopover} -->
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
		<MonthNav today={window.moment()} />
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
		<YearNav today={window.moment()} />
		<table class="calendar">
			<tbody>
				{#each monthsIndexesInQuarters as quarterMonths, i}
					<tr>
						{#if showWeekNums}
							<td>
								<button
									on:click={(event) =>
										eventHandlers.onClick({
											date: $displayedDate.quarter(i + 1).startOf('quarter'),
											isNewSplit: isMetaPressed(event),
											granularity: 'quarter'
										})}
									on:contextmenu={(event) =>
										eventHandlers.onContextMenu({
											date: $displayedDate.quarter(i + 1).startOf('quarter'),
											event,
											granularity: 'quarter'
										})}
									on:pointerenter={(event) =>
										eventHandlers.onHover({
											date: $displayedDate.quarter(i + 1).startOf('quarter'),
											targetEl: event.target,
											isMetaPressed: isMetaPressed(event),
											granularity: 'quarter'
										})}>Q{i + 1}</button
								>
							</td>
						{/if}
						{#each quarterMonths as monthIndex}
							<td>
								<button
									on:click={(event) =>
										eventHandlers.onClick({
											date: $displayedDate.month(monthIndex).startOf('month'),
											isNewSplit: isMetaPressed(event),
											granularity: 'month'
										})}
									on:contextmenu={(event) =>
										eventHandlers.onContextMenu({
											date: $displayedDate.month(monthIndex).startOf('month'),
											event,
											granularity: 'month'
										})}
									on:pointerenter={(event) =>
										eventHandlers.onHover({
											date: $displayedDate.month(monthIndex).startOf('month'),
											targetEl: event.target,
											isMetaPressed: isMetaPressed(event),
											granularity: 'month'
										})}>{$displayedDate.month(monthIndex).format('MMMM')}</button
								>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	{#if crrView === 'years'}
		<YearsNav today={window.moment()} />
		<table class="calendar">
			<tbody>
				{#each getYears( { startRangeYear: +$yearsRanges.ranges[$yearsRanges.crrRangeIndex].split('-')[0] } ) as yearsRange}
					<tr>
						{#each yearsRange as year}
							<td>
								<button
									on:click={(event) =>
										eventHandlers.onClick({
											date: $displayedDate.year(year).startOf('year'),
											isNewSplit: isMetaPressed(event),
											granularity: 'year'
										})}
									on:contextmenu={(event) =>
										eventHandlers.onContextMenu({
											date: $displayedDate.year(year).startOf('year'),
											event,
											granularity: 'year'
										})}
									on:pointerenter={(event) => {
										eventHandlers.onHover({
											date: $displayedDate.year(year).startOf('year'),
											targetEl: event.target,
											isMetaPressed: isMetaPressed(event),
											granularity: 'year'
										});
									}}>{year}</button
								>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	<!-- <PopoverMenu
    referenceElement="{$hoveredDay}"
    metadata="{popoverMetadata}"
    isVisible="{showPopover}"
  /> -->
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
