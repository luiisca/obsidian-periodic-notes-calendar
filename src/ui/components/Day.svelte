<svelte:options immutable />

<script lang="ts">
	import { run } from 'svelte/legacy';

	import type { Moment } from 'moment';

	import { activeFilepathStore, displayedDateStore } from '@/stores/';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { getFileData } from '@/io';
	import { settingsStore } from '@/settings';
	import { cn } from '@/ui/utils';
	import { todayStore } from '@/stores/dates';

	
	interface Props {
		// Properties
		date: Moment;
	}

	let { date }: Props = $props();

	// file obtained with filename generated using selected format for given period
	let { file, sticker } = $state(getFileData('day', date));
	run(() => {
		if ($settingsStore.filepaths) {
			const fileData = getFileData('day', date);
			file = fileData.file;
			sticker = fileData.sticker;
		}
	});
	let isActive = $derived($activeFilepathStore === file?.path);
	let isToday = $derived(date.isSame($todayStore, 'day'));
	let isAdjacentMonth = $derived(!date.isSame($displayedDateStore, 'month'));
</script>

<td>
	<button
		class={cn(
			'relative [&:not(:focus-visible)]:shadow-none !h-auto w-full flex flex-col font-medium rounded-[--radius-s] text-sm px-1 pt-2.5 pb-4 text-center tabular-nums transition-colors',
			isActive
				? 'text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover]'
				: isToday
				? 'text-[--color-text-today] hover:bg-[--interactive-hover]'
				: isAdjacentMonth
				? 'opacity-25 hover:bg-[--interactive-hover]'
				: 'text-[--text-normal] hover:bg-[--interactive-hover]',
			isActive && isToday && 'text-[--text-on-accent]'
		)}
		id="day"
		onclick={(event) =>
			eventHandlers.onClick({
				date,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'day'
			})}
		oncontextmenu={(event) =>
			eventHandlers.onContextMenu({
				event,
				fileData: {
					file,
					sticker
				},
				date,
				granularity: 'day'
			})}
		onpointerenter={(event) => {
			eventHandlers.onHover({
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				file
			});
		}}
	>
		{date.format('D')}
		<div class="absolute leading-[0] bottom-[calc(1rem/2)] translate-y-1/3">
			<Dot isVisible={!!file} isFilled={!!file} {isActive} />
		</div>
	</button>
	<Sticker sticker={sticker?.emoji} />
</td>
