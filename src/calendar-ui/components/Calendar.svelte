<script lang="ts">
	import weekOfYear from 'dayjs/plugin/weekOfYear';
	import isoWeek from 'dayjs/plugin/isoWeek';

	window.dayjs.extend(weekOfYear);
	window.dayjs.extend(isoWeek);

	import { getContext, setContext } from 'svelte';
	import { writable } from 'svelte/store';


	import { DISPLAYED_MONTH, IS_MOBILE, VIEW } from '../context';
	// import PopoverMenu from "./popover/PopoverMenu.svelte";
	// import Day from './Day.svelte';
	// import Nav from './Nav.svelte';
	// import WeekNum from './WeekNum.svelte';
	import { getMonth, getStartOfWeek, isWeekend } from '../utils';
	import { notesStores, settingsStore } from '@/stores';
	import type { CalendarView } from '@/view';
	import Day from './Day.svelte';
	import Nav from './Nav.svelte';
	import WeekNum from './WeekNum.svelte';
	import { granularities } from '@/constants';
	import type { Moment } from 'moment';

	const { app } = getContext<CalendarView>(VIEW);

	$: ({
		localeData: { showWeekNums, localizedWeekdaysShort }
	} = $settingsStore);

	let displayedMonth = writable<Moment>(window.moment());
	setContext(DISPLAYED_MONTH, displayedMonth);

	$: month = getMonth($displayedMonth);

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
	<Nav today={window.moment()} />
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
	<!-- <PopoverMenu
    referenceElement="{$hoveredDay}"
    metadata="{popoverMetadata}"
    isVisible="{showPopover}"
  /> -->
</div>

<style>
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
