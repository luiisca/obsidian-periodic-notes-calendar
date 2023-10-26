<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { Moment } from 'moment';

	import Arrow from './Arrow.svelte';
	import { VIEW } from '../context';
	import Dot from './Dot.svelte';
	import type { ICalendarViewCtx } from '@/view';
	import { isMetaPressed } from '../utils';
	import { displayedDateStore, yearsRanges } from '@/stores';

	let today: Moment;
	$: $displayedDateStore, (today = window.moment());

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	function decrementdisplayedDate() {
		let newYear = 0;
		displayedDateStore.update((date) => {
			const newDate = date.clone().subtract(1, 'month');
			newYear = newDate.year();

			return newDate;
		});

		const crrRange = $yearsRanges.ranges[$yearsRanges.crrRangeIndex];
		const crrRangeStartYear = crrRange.split('-')[0];
		if (newYear < +crrRangeStartYear) {
			yearsRanges.updateRanges({ action: 'decrement' });
		}
	}

	function incrementdisplayedDate() {
		let newYear = 0;
		displayedDateStore.update((date) => {
			const newDate = date.clone().add(1, 'month');
			newYear = newDate.year();

			return newDate;
		});

		const crrRange = $yearsRanges.ranges[$yearsRanges.crrRangeIndex];
		const crrRangeEndYear = crrRange.split('-')[1];
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

	let showingCurrentMonth: boolean;
	$: showingCurrentMonth = $displayedDateStore.isSame(today, 'month');
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
				{$displayedDateStore.format('MMMM')}
			</button>
			<button
				class="year [all:inherit]"
				on:click={(event) =>
					eventHandlers.onClick({
						date: $displayedDateStore.startOf('year'),
						isNewSplit: isMetaPressed(event),
						granularity: 'year'
					})}
				on:contextmenu={(event) =>
					eventHandlers.onContextMenu({
						date: $displayedDateStore.startOf('year'),
						event,
						granularity: 'year'
					})}
				on:pointerenter={(event) => {
					eventHandlers.onHover({
						date: $displayedDateStore.startOf('year'),
						targetEl: event.target,
						isMetaPressed: isMetaPressed(event),
						granularity: 'year'
					});
				}}
			>
				{$displayedDateStore.format('YYYY')}
			</button>
		</span>
	</div>

	<div class="right-nav">
		<!-- TODO: add tab support -->
		<Arrow direction="left" onClick={decrementdisplayedDate} tooltip="Previous Month" />
		<button
			aria-label={!showingCurrentMonth ? 'Reset to current month' : null}
			class="reset-button"
			class:active={showingCurrentMonth}
			on:click={resetdisplayedDate}
		>
			<Dot class="h-3 w-3" isFilled={showingCurrentMonth} />
		</button>
		<Arrow direction="right" onClick={incrementdisplayedDate} tooltip="Next Month" />
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
