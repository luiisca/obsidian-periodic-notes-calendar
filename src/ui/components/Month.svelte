<svelte:options immutable />

<script lang="ts">
	import { run } from 'svelte/legacy';

	import { activeFilepathStore, displayedDateStore } from '@/stores';
	import { cn, eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { getFileData } from '@/io';
	import { settingsStore } from '@/settings';
	import { todayStore } from '@/stores/dates';

	interface Props {
		monthIndex: number;
	}

	let { monthIndex }: Props = $props();
	let date = $derived($displayedDateStore.clone().month(monthIndex).startOf('month'));

	let { file, sticker } = $state(getFileData('month', date));
	run(() => {
		if ($settingsStore.filepaths) {
			const fileData = getFileData('month', date);
			file = fileData.file;
			sticker = fileData.sticker;
		}
	});
	let isActive = $derived($activeFilepathStore === file?.path);
	let isToday = $derived(date.isSame($todayStore, 'month'));
</script>

<td>
	<button
		class={cn(
			'relative [&:not(:focus-visible)]:shadow-none !h-auto w-full flex flex-col items-center justify-center font-medium rounded-[--radius-s] text-sm px-1 py-8 mb-3 text-center tabular-nums transition-colors',
			isActive
				? 'text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover]'
				: isToday
				? 'text-[--color-text-today] hover:bg-[--interactive-hover]'
				: 'text-[--text-normal] hover:bg-[--interactive-hover]',
			isActive && isToday && 'text-[--text-on-accent]'
		)}
		id="month"
		onclick={(event) =>
			eventHandlers.onClick({
				date,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'month'
			})}
		oncontextmenu={(event) =>
			eventHandlers.onContextMenu({
				event,
				fileData: {
					file,
					sticker
				},
				date,
				granularity: 'month'
			})}
		onpointerenter={(event) =>
			eventHandlers.onHover({
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				file
			})}
	>
		<p
			class="text-[2.75rem] font-normal -z-10 opacity-20 text-[--text-muted] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
		>
			{monthIndex < 9 ? '0' : ''}{monthIndex + 1}
		</p>
		<p>
			{$displayedDateStore.clone().month(monthIndex).format('MMMM')}
		</p>
		<div class="absolute leading-[0] bottom-[calc(1.75rem/2)] translate-y-full">
			<Dot isVisible={!!file} isFilled={!!file} {isActive} />
		</div>
	</button>
	<Sticker sticker={sticker?.emoji} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind utilities;
</style>
