<svelte:options immutable />

<script lang="ts">
	import { run } from 'svelte/legacy';

	import { getFileData } from '@/io';
	import { displayedDateStore } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { settingsStore } from '@/settings';

	interface Props {
		quarterNum: number;
	}

	let { quarterNum }: Props = $props();

	let date = $derived($displayedDateStore.clone().quarter(quarterNum).startOf('quarter'));
	let { file, sticker } = $state(getFileData('quarter', date));
	run(() => {
		if ($settingsStore.filepaths) {
			const fileData = getFileData('quarter', date);
			file = fileData.file;
			sticker = fileData.sticker;
		}
	});
</script>

<td class="relative">
	<button
		id="period-num"
		onclick={(event) =>
			eventHandlers.onClick({
				date,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'quarter'
			})}
		oncontextmenu={(event) =>
			eventHandlers.onContextMenu({
				event,
				fileData: {
					file,
					sticker
				},
				date,
				granularity: 'quarter'
			})}
		onpointerenter={(event) =>
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
	@tailwind utilities;
</style>
