<script lang="ts">
	import { getContext } from 'svelte';
	import type { Moment } from 'moment';

	import Arrow from './Arrow.svelte';
	import { VIEW } from '../context';
	import Dot from './Dot.svelte';
	import type { ICalendarViewCtx } from '@/view';
	import { isMetaPressed } from '../utils';
	import { displayedDateStore, yearsRanges } from '@/stores';
	import { YEARS_RANGE_SIZE } from '@/constants';

	let today: Moment;
	$: $displayedDateStore, (today = window.moment());

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	function decrementdisplayedYear() {
		let newYear = 0;
		displayedDateStore.update((date) => {
			const newDate = date.clone().subtract(1, 'year');
			newYear = newDate.year();

			return newDate;
		});

		const { ranges, crrRangeIndex } = $yearsRanges;
		const crrRange = ranges[crrRangeIndex];
		const [crrRangeStartYear] = crrRange.split('-');
		if (newYear < +crrRangeStartYear) {
			yearsRanges.updateRanges({ action: 'decrement' });
		}
	}

	function incrementdisplayedDate() {
		let newYear = 0;
		displayedDateStore.update((date) => {
			const newDate = date.clone().add(1, 'year');
			newYear = newDate.year();

			return newDate;
		});

		const { ranges, crrRangeIndex } = $yearsRanges;
		const crrRange = ranges[crrRangeIndex];
		const [_, crrRangeEndYear] = crrRange.split('-');
		if (newYear > +crrRangeEndYear) {
			yearsRanges.updateRanges({ action: 'increment' });
		}
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
			// select or create new range every time displayed date updates
			yearsRanges.selectOrCreateRanges();
		})();
</script>

<div class="nav">
	<div>
		<span class="flex justify-between title">
			<button
				class="month [all:inherit]"
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
			<span class="year cursor-default">
				{$yearsRanges.ranges?.[$yearsRanges.crrRangeIndex] || ''}
			</span>
		</span>
	</div>

	<div class="right-nav">
		<!-- TODO: add tab support -->
		<Arrow direction="left" onClick={decrementdisplayedYear} tooltip="Previous Year" />
		<button
			aria-label={!showingCurrentYear ? 'Reset to current year' : null}
			class="reset-button"
			class:active={showingCurrentYear}
			on:click={resetdisplayedDate}
		>
			<Dot class="h-3 w-3" isFilled={showingCurrentYear} />
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
		cursor: pointer;
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
