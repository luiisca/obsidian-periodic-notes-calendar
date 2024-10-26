<svelte:options immutable />

<script lang="ts">
	import { getFileData } from '@/io';
	import { displayedDateStore } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { justModFileDataStore } from '@/stores/notes';

	export let year: number;

	$: date = $displayedDateStore.clone().year(year).startOf('year');
	let { file, sticker } = getFileData('year', date);
	$: {
		if ($justModFileDataStore && $justModFileDataStore.op === 'created') {
			const fileData = getFileData('year', date);
			file = fileData.file;
			sticker = fileData.sticker;
		}
	}
</script>

<td class="relative">
	<button
		id="year"
		on:click={(event) =>
			eventHandlers.onClick({
				date,
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
				date,
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
		{year}
		<Dot isFilled={!!file} isActive={!!file} />
	</button>

	<Sticker sticker={sticker?.emoji} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>

