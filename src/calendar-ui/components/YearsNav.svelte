<script lang="ts">
	import { YEARS_RANGE_SIZE } from '@/constants';
	import Arrow from './Arrow.svelte';
	import Dot from './Dot.svelte';
	import { displayedDateStore, yearsRanges } from '@/stores';

	const todayMoment = window.moment();

	function decrementdisplayedYearRange() {
		console.log('decrementdisplayedYearRange() > yearsRanges store: ', $yearsRanges);

		yearsRanges.updateRanges({ action: 'decrement', displayedDateModifier: -YEARS_RANGE_SIZE });
	}

	function incrementdisplayedDate() {
		console.log('incrementedisplayedDate() > yearsRanges store: ', $yearsRanges);

		yearsRanges.updateRanges({ action: 'increment' });
	}

	function resetdisplayedDate() {
		yearsRanges.update((values) => ({
			...values,
			crrRangeIndex: values.ranges.findIndex((range) => range === values.todayRange)
		}));

		displayedDateStore.set(todayMoment.clone());
	}

	let showingCurrentRange: boolean;
	$: $displayedDateStore,
		(() => {
			showingCurrentRange =
				$yearsRanges.todayRange === $yearsRanges.ranges[$yearsRanges.crrRangeIndex];

			// add new ranges or update existing ones every time displayed date changes
			yearsRanges.selectOrCreateRanges();
		})();
	$: crrRange = $yearsRanges.ranges[$yearsRanges.crrRangeIndex].split('-');
</script>

<div class="flex flex-col space-y-1 mt-2.5 px-2">
	<div class="text-[--color-text-title] text-7xl [&:not(:focus-visible)]:shadow-none font-semibold">
		{crrRange[0]} - {crrRange[1].slice(2)}
	</div>

	<div class="flex items-center -ml-1">
		<Arrow direction="left" onClick={decrementdisplayedYearRange} tooltip="Previous Year" />
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 {showingCurrentRange
				? 'opacity-100'
				: 'opacity-60 '}"
			on:click={resetdisplayedDate}
			aria-label={!showingCurrentRange ? 'Reset to current year' : null}
		>
			<Dot class="h-[8px] w-[8px]" isFilled={showingCurrentRange} />
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
