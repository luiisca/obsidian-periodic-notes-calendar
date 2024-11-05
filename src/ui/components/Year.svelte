<svelte:options immutable />

<script lang="ts">
	import { run } from 'svelte/legacy';

	import { getFileData } from '@/io';
	import { activeFilepathStore, displayedDateStore } from '@/stores';
	import { cn, eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { settingsStore } from '@/settings';
	import { todayStore } from '@/stores/dates';

	interface Props {
		year: number;
	}

	let { year }: Props = $props();
	let date = $derived($displayedDateStore.clone().year(year).startOf('year'));

	let { file, sticker } = $state(getFileData('year', date));
	run(() => {
		if ($settingsStore.filepaths) {
			const fileData = getFileData('year', date);
			file = fileData.file;
			sticker = fileData.sticker;
		}
	});
	let isActive = $derived($activeFilepathStore === file?.path);
	let isToday = $derived(date.isSame($todayStore, 'year'));
</script>

<td>
	<button
		class={cn(
			'relative [&:not(:focus-visible)]:shadow-none !h-auto w-full flex flex-col font-medium rounded-[--radius-s] text-sm px-1 pt-2.5 pb-4 text-center tabular-nums transition-colors',
			isActive
				? 'text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover]'
				: isToday
				? 'text-[--color-text-today] hover:bg-[--interactive-hover]'
				: 'text-[--text-normal] hover:bg-[--interactive-hover]',
			isActive && isToday && 'text-[--text-on-accent]'
		)}
		id="year"
		onclick={(event) =>
			eventHandlers.onClick({
				date,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'year'
			})}
		oncontextmenu={(event) =>
			eventHandlers.onContextMenu({
				event,
				fileData: {
					file,
					sticker
				},
				date,
				granularity: 'year'
			})}
		onpointerenter={(event) => {
			eventHandlers.onHover({
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				file
			});
		}}
	>
		{year}
		<div class="absolute leading-[0] bottom-[calc(1rem/2)] translate-y-[35%]">
			<Dot isVisible={!!file} isFilled={!!file} {isActive} />
		</div>
	</button>

	<Sticker sticker={sticker?.emoji} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind utilities;
</style>
