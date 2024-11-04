<script lang="ts">
	import type { Moment } from 'moment';

	import { displayedDateStore, yearsRanges } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Arrow from './Arrow.svelte';
	import Dot from './Dot.svelte';
	import { getFileData } from '@/io';
	import { settingsStore } from '@/settings';

	let today: Moment;
	$: $displayedDateStore, (today = window.moment());

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

	let { file: monthFile, sticker: monthSticker } = getFileData('month', $displayedDateStore);
	let { file: yearFile, sticker: yearSticker } = getFileData(
		'year',
		$displayedDateStore.clone().startOf('year')
	);
	$: {
		if ($settingsStore.filepaths) {
			const monthFileData = getFileData('month', $displayedDateStore);
			monthFile = monthFileData.file;

			const yearFileData = getFileData('year', $displayedDateStore.clone().startOf('year'));
			yearFile = yearFileData.file;
		}
	}
</script>

<div class="flex flex-col space-y-1 mt-3 mb-1.5 px-2" id="nav">
	<div class="flex justify-between items-end text-[--color-text-title]" id="title">
		<button
			class="h-auto text-7xl [&:not(:focus-visible)]:shadow-none font-semibold"
			id="month"
			on:click={(event) =>
				eventHandlers.onClick({
					date: $displayedDateStore,
					createNewSplitLeaf: isControlPressed(event),
					granularity: 'month'
				})}
			on:contextmenu={(event) =>
				eventHandlers.onContextMenu({
					event,
					fileData: {
						file: monthFile,
						sticker: monthSticker
					},
					date: $displayedDateStore,
					granularity: 'month'
				})}
			on:pointerenter={(event) => {
				eventHandlers.onHover({
					targetEl: event.target,
					isControlPressed: isControlPressed(event),
					file: monthFile
				});
			}}
		>
			{$displayedDateStore.format('MMM')}
		</button>
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--interactive-accent] font-medium text-lg"
			id="year"
			on:click={(event) =>
				eventHandlers.onClick({
					date: $displayedDateStore.clone().startOf('year'),
					createNewSplitLeaf: isControlPressed(event),
					granularity: 'year'
				})}
			on:contextmenu={(event) =>
				eventHandlers.onContextMenu({
					event,
					fileData: {
						file: yearFile,
						sticker: yearSticker
					},
					date: $displayedDateStore.clone().startOf('year'),
					granularity: 'year'
				})}
			on:pointerenter={(event) => {
				eventHandlers.onHover({
					targetEl: event.target,
					isControlPressed: isControlPressed(event),
					file: yearFile
				});
			}}
		>
			{$displayedDateStore.format('YYYY')}
		</button>
	</div>

	<div class="flex items-center -ml-1" id="bottom-nav">
		<Arrow direction="left" onClick={decrementdisplayedDate} tooltip="Previous Month" />
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 {showingCurrentMonth
				? 'opacity-100'
				: 'opacity-60 '}"
			id="reset-button"
			on:click={resetdisplayedDate}
			aria-label={!showingCurrentMonth ? 'Current Month' : null}
		>
			<Dot className="h-[8px] w-[8px]" isFilled={showingCurrentMonth} />
		</button>
		<Arrow direction="right" onClick={incrementdisplayedDate} tooltip="Next Month" />
	</div>
</div>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	button {
		background-color: transparent;
	}
</style>
