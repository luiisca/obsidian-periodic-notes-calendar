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
			// select or create new range every time displayed date updates
			yearsRanges.selectOrCreateRanges();
		})();
</script>

<div class="nav">
	<div>
		<span class="flex justify-between title">
			<span class="month">
				{$yearsRanges.ranges[$yearsRanges.crrRangeIndex]}
			</span>
		</span>
	</div>

	<div class="right-nav">
		<!-- TODO: add tab support -->
		<Arrow direction="left" onClick={decrementdisplayedYearRange} tooltip="Previous Year" />
		<button
			aria-label={!showingCurrentRange ? 'Reset to current year' : null}
			class="reset-button"
			class:active={showingCurrentRange}
			on:click={resetdisplayedDate}
		>
			<Dot class="h-3 w-3" isFilled={showingCurrentRange} />
		</button>
		<Arrow direction="right" onClick={incrementdisplayedDate} tooltip="Next Year" />
	</div>
</div>

<style>
	@tailwind components;
	@tailwind utilities;

	.nav {
		align-items: baseline;
		display: flex;
		margin: 0.6em 0 1em;
		padding: 0 8px;
		width: 100%;
	}

	.title {
		color: var(--color-text-title);
		display: flex;
		font-size: 1.4em;
		gap: 0.3em;
		margin: 0;
	}

	.month {
		font-weight: 500;
	}

	.year {
		color: var(--interactive-accent);
	}

	.right-nav {
		align-items: center;
		display: flex;
		justify-content: center;
		margin-left: auto;
	}

	.reset-button {
		all: inherit;
		cursor: pointer;
		align-items: center;
		color: var(--color-arrow);
		display: flex;
		opacity: 0.4;
		padding: 0.5em;
	}

	.reset-button.active {
		cursor: pointer;
		opacity: 1;
	}
</style>
