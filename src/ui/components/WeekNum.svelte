<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';

	import { getFileData } from '@/io';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { settingsStore } from '@/settings';

	// Properties
	export let weekNum: number;
	export let startOfWeekDate: Moment;

	let { file, sticker } = getFileData('week', startOfWeekDate);
	$: {
		if ($settingsStore.filepaths) {
			const fileData = getFileData('week', startOfWeekDate);
			file = fileData.file;
			sticker = fileData.sticker;
		}
	}
</script>

<td class="relative">
	<button
		id="period-num"
		on:click={(event) =>
			eventHandlers.onClick({
				date: startOfWeekDate,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'week'
			})}
		on:contextmenu={(event) =>
			eventHandlers.onContextMenu({
				event,
				fileData: {
					file,
					sticker
				},
				date: startOfWeekDate,
				granularity: 'week'
			})}
		on:pointerenter={(event) => {
			eventHandlers.onHover({
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				file
			});
		}}
	>
		{weekNum}
		<Dot isFilled={!!file} isActive={!!file} />
	</button>
	<Sticker sticker={sticker?.emoji} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	td {
		border-right: 1px solid var(--background-modifier-border);
	}
</style>
