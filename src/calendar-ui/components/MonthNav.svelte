<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { Moment } from 'moment';

	import Arrow from './Arrow.svelte';
	import { VIEW } from '../context';
	import Dot from './Dot.svelte';
	import { isMetaPressed } from '../utils';
	import { displayedDateStore, yearsRanges } from '@/stores';
	import type { ICalendarViewCtx } from '@/types/view';

	let today: Moment;
	$: $displayedDateStore, (today = window.moment());

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	function decrementdisplayedDate() {
		displayedDateStore.update((date) => date.clone().subtract(1, 'month'));
	}

	function incrementdisplayedDate() {
		displayedDateStore.update((date) => date.clone().add(1, 'month'));
	}

	function resetdisplayedDate() {
		yearsRanges.update((values) => ({
			...values,
			crrRangeIndex: values.ranges.findIndex((range) => range === values.todayRange)
		}));

		displayedDateStore.set(today.clone());
	}

	let showingCurrentMonth: boolean;
	$: showingCurrentMonth = $displayedDateStore.isSame(today, 'month');
</script>

<div class="flex flex-col space-y-1 mt-2.5 px-2">
	<div class="flex justify-between items-end text-[--color-text-title]">
		<button
			class="h-auto text-7xl [&:not(:focus-visible)]:shadow-none font-semibold"
			on:click={(event) =>
				eventHandlers.onClick({
					date: $displayedDateStore,
					isNewSplit: isMetaPressed(event),
					granularity: 'month'
				})}
			on:contextmenu={(event) =>
				eventHandlers.onContextMenu({ date: $displayedDateStore, event, granularity: 'month' })}
			on:pointerenter={(event) => {
				eventHandlers.onHover({
					date: $displayedDateStore,
					targetEl: event.target,
					isMetaPressed: isMetaPressed(event),
					granularity: 'month'
				});
			}}
		>
			{$displayedDateStore.format('MMM')}
		</button>
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--interactive-accent] font-medium opacity-60"
			on:click={(event) =>
				eventHandlers.onClick({
					date: $displayedDateStore.clone().startOf('year'),
					isNewSplit: isMetaPressed(event),
					granularity: 'year'
				})}
			on:contextmenu={(event) =>
				eventHandlers.onContextMenu({
					date: $displayedDateStore.clone().startOf('year'),
					event,
					granularity: 'year'
				})}
			on:pointerenter={(event) => {
				eventHandlers.onHover({
					date: $displayedDateStore.clone().startOf('year'),
					targetEl: event.target,
					isMetaPressed: isMetaPressed(event),
					granularity: 'year'
				});
			}}
		>
			{$displayedDateStore.format('YYYY')}
		</button>
	</div>

	<div class="flex items-center -ml-1">
		<!-- TODO: add tab support -->
		<Arrow direction="left" onClick={decrementdisplayedDate} tooltip="Previous Month" />
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 {showingCurrentMonth
				? 'opacity-100'
				: 'opacity-60 '}"
			on:click={resetdisplayedDate}
			aria-label={!showingCurrentMonth ? 'Display Current Month' : null}
		>
			<Dot class="h-[8px] w-[8px]" isFilled={showingCurrentMonth} isActive={true}/>
		</button>
		<Arrow direction="right" onClick={incrementdisplayedDate} tooltip="Next Month" />
	</div>
</div>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	button {
		background-color: transparent;
	}
</style>
