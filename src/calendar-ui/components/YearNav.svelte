<script lang="ts">
	import { getContext } from 'svelte';
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
		displayedDateStore.update((date) => date.clone().subtract(1, 'year'));
	}

	function incrementdisplayedDate() {
		displayedDateStore.update((date) => date.clone().add(1, 'year'));
	}

	function resetdisplayedDate() {
		yearsRanges.update((values) => ({
			...values,
			crrRangeIndex: values.ranges.findIndex((range) => range === values.todayRange)
		}));

		displayedDateStore.set(today.clone());
	}

	let showingCurrentYear: boolean;
	$: $displayedDateStore,
		(() => {
			showingCurrentYear = $displayedDateStore.isSame(today, 'year');

			// add new ranges or update existing ones every time displayed date changes
			yearsRanges.selectOrCreateRanges();
		})();
</script>

<div class="flex flex-col space-y-1 mt-2.5 px-2">
	<div class="flex justify-between items-end text-[--color-text-title]">
		<button
			class="h-auto text-7xl [&:not(:focus-visible)]:shadow-none font-semibold"
			on:click={(event) =>
				eventHandlers.onClick({
					date: $displayedDateStore,
					isNewSplit: isMetaPressed(event),
					granularity: 'year'
				})}
			on:contextmenu={(event) =>
				eventHandlers.onContextMenu({
					date: $displayedDateStore,
					event,
					granularity: 'year'
				})}
			on:pointerenter={(event) => {
				eventHandlers.onHover({
					date: $displayedDateStore,
					targetEl: event.target,
					isMetaPressed: isMetaPressed(event),
					granularity: 'year'
				});
			}}
		>
			{$displayedDateStore.format('YYYY')}
		</button>
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--interactive-accent] font-medium opacity-60"
		>
			{$yearsRanges.ranges[$yearsRanges.crrRangeIndex]}
		</button>
	</div>

	<div class="flex items-center -ml-1">
		<Arrow direction="left" onClick={decrementdisplayedDate} tooltip="Previous Year" />
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 {showingCurrentYear
				? 'opacity-100'
				: 'opacity-60 '}"
			on:click={resetdisplayedDate}
			aria-label={!showingCurrentYear ? 'Reset to current year' : null}
		>
			<Dot class="h-[8px] w-[8px]" isFilled={showingCurrentYear} />
		</button>
		<Arrow direction="right" onClick={incrementdisplayedDate} tooltip="Next Year" />
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
