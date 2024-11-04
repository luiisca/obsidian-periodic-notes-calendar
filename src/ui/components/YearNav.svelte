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

	let { file, sticker } = getFileData('year', $displayedDateStore);
	$: {
		if ($settingsStore.filepaths) {
			const fileData = getFileData('year', $displayedDateStore);
			file = fileData.file;
		}
	}
</script>

<div class="flex flex-col space-y-1 mt-2.5 px-2" id="nav">
	<div class="flex justify-between items-end text-[--color-text-title]" id="title">
		<button
			class="h-auto text-7xl [&:not(:focus-visible)]:shadow-none font-semibold"
			id="year"
			on:click={(event) =>
				eventHandlers.onClick({
					date: $displayedDateStore,
					createNewSplitLeaf: isControlPressed(event),
					granularity: 'year'
				})}
			on:contextmenu={(event) =>
				eventHandlers.onContextMenu({
					event,
					fileData: {
						file,
						sticker
					},
					date: $displayedDateStore,
					granularity: 'year'
				})}
			on:pointerenter={(event) => {
				eventHandlers.onHover({
					targetEl: event.target,
					isControlPressed: isControlPressed(event),
					file
				});
			}}
		>
			{$displayedDateStore.format('YYYY')}
		</button>
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--interactive-accent] font-medium opacity-60"
			id="years-range"
		>
			{$yearsRanges.ranges[$yearsRanges.crrRangeIndex]}
		</button>
	</div>

	<div class="flex items-center -ml-1" id="bottom-nav">
		<Arrow direction="left" onClick={decrementdisplayedDate} tooltip="Previous Year" />
		<button
			class="[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 {showingCurrentYear
				? 'opacity-100'
				: 'opacity-60 '}"
			id="reset-button"
			on:click={resetdisplayedDate}
			aria-label={!showingCurrentYear ? 'Reset to current year' : null}
		>
			<Dot className="h-[8px] w-[8px]" isFilled={showingCurrentYear} />
		</button>
		<Arrow direction="right" onClick={incrementdisplayedDate} tooltip="Next Year" />
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
