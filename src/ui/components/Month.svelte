<svelte:options immutable />

<script lang="ts">
	import { displayedDateStore } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { getFileData } from '@/io';
	import { justModFileDataStore } from '@/stores/notes';

	export let monthIndex: number;

	$: date = $displayedDateStore.clone().month(monthIndex).startOf('month');
	let { file, sticker } = getFileData('month', date);
	$: {
		if ($justModFileDataStore && $justModFileDataStore.op === 'created') {
			const fileData = getFileData('month', date);
			file = fileData.file;
			sticker = fileData.sticker;
		}
	}
</script>

<td class="relative">
	<button
		id="month"
		on:click={(event) =>
			eventHandlers.onClick({
				date,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'month'
			})}
		on:contextmenu={(event) =>
			eventHandlers.onContextMenu({
				event,
				fileData: {
					file,
					sticker
				},
				date,
				granularity: 'month'
			})}
		on:pointerenter={(event) =>
			eventHandlers.onHover({
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				file
			})}
	>
		{$displayedDateStore.clone().month(monthIndex).format('MMMM')}
		<Dot isFilled={!!file} isActive={!!file} />
	</button>

	<Sticker sticker={sticker?.emoji} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
