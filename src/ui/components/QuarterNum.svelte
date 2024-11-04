<svelte:options immutable />

<script lang="ts">
	import { getFileData } from '@/io';
	import { displayedDateStore } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { settingsStore } from '@/settings';

	export let quarterNum: number;

	$: date = $displayedDateStore.clone().quarter(quarterNum).startOf('quarter');
	let { file, sticker } = getFileData('quarter', date);
	$: {
		if ($settingsStore.filepaths) {
			const fileData = getFileData('quarter', date);
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
				date,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'quarter'
			})}
		on:contextmenu={(event) =>
			eventHandlers.onContextMenu({
				event,
				fileData: {
					file,
					sticker
				},
				date,
				granularity: 'quarter'
			})}
		on:pointerenter={(event) =>
			eventHandlers.onHover({
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				file
			})}
	>
		Q{quarterNum}
		<Dot isFilled={!!file} isActive={!!file} />
	</button>

	<Sticker sticker={sticker?.emoji} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
