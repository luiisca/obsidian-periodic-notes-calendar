<svelte:options immutable />

<script lang="ts">
	import { run } from 'svelte/legacy';

	import type { Moment } from 'moment';

	import { getFileData } from '@/io';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';
	import { settingsStore } from '@/settings';

	
	interface Props {
		// Properties
		weekNum: number;
		startOfWeekDate: Moment;
	}

	let { weekNum, startOfWeekDate }: Props = $props();

	let { file, sticker } = $state(getFileData('week', startOfWeekDate));
	run(() => {
		if ($settingsStore.filepaths) {
			const fileData = getFileData('week', startOfWeekDate);
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
				date: startOfWeekDate,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'week'
			})}
		oncontextmenu={(event) =>
			eventHandlers.onContextMenu({
				event,
				fileData: {
					file,
					sticker
				},
				date: startOfWeekDate,
				granularity: 'week'
			})}
		onpointerenter={(event) => {
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
	@tailwind utilities;

	td {
		border-right: 1px solid var(--background-modifier-border);
	}
</style>
