<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { Moment } from 'moment';

	import Arrow from './Arrow.svelte';
	import { DISPLAYED_DATE, VIEW } from '../context';
	import Dot from './Dot.svelte';
	import type { ICalendarViewCtx } from '@/view';
	import { isMetaPressed } from '../utils';
	import { yearsRanges } from '@/stores';

	export let today: Moment;

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);
	let displayedDate = getContext<Writable<Moment>>(DISPLAYED_DATE);

	function decrementdisplayedDate() {
		let newYear = 0;
		displayedDate.update((date) => {
			const newDate = date.clone().subtract(1, 'year');
			newYear = newDate.year();

			return newDate;
		});

		yearsRanges.updateRanges({ year: newYear, action: 'decrement' });
	}

	function incrementdisplayedDate() {
		let newYear = 0;
		displayedDate.update((date) => {
			const newDate = date.clone().add(1, 'year');
			newYear = newDate.year();

			return newDate;
		});

		yearsRanges.updateRanges({ year: newYear, action: 'increment' });
	}

	function resetdisplayedDate() {
		yearsRanges.update((values) => ({
			...values,
			crrRangeIndex: values.ranges.findIndex((range) => range === values.todayRange)
		}));

		displayedDate.set(today.clone());
	}

	let showingCurrentMonth: boolean;
	$: showingCurrentMonth = $displayedDate.isSame(today, 'year');
</script>

<div class="nav">
	<div>
		<span class="flex justify-between title">
			<button
				class="month [all:inherit]"
				on:click={(event) =>
					eventHandlers.onClick({
						date: $displayedDate,
						isNewSplit: isMetaPressed(event),
						granularity: 'year'
					})}
				on:contextmenu={(event) =>
					eventHandlers.onContextMenu({
						date: $displayedDate,
						event,
						granularity: 'year'
					})}
				on:pointerenter={(event) => {
					eventHandlers.onHover({
						date: $displayedDate,
						targetEl: event.target,
						isMetaPressed: isMetaPressed(event),
						granularity: 'year'
					});
				}}
			>
				{$displayedDate.format('YYYY')}
			</button>
			<span class="year cursor-default">
				{$yearsRanges.ranges?.[$yearsRanges.crrRangeIndex] || ''}
			</span>
		</span>
	</div>

	<div class="right-nav">
		<!-- TODO: add tab support -->
		<Arrow direction="left" onClick={decrementdisplayedDate} tooltip="Previous Year" />
		<button
			aria-label={!showingCurrentMonth ? 'Reset to current year' : null}
			class="reset-button"
			class:active={showingCurrentMonth}
			on:click={resetdisplayedDate}
		>
			<Dot class="h-3 w-3" isFilled={showingCurrentMonth} />
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
