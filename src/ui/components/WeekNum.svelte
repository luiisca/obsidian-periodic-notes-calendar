<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';

	import { getDateUID } from '@/io';
	import { notesStores } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';

	// Properties
	export let weekNum: number;
	export let startOfWeekDate: Moment;

	const notesStore = notesStores['week'];
	const dateUID = getDateUID({ date: startOfWeekDate, granularity: 'week' });
	$: file = $notesStore[dateUID]?.file;
	$: sticker = $notesStore[dateUID]?.sticker;
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
			eventHandlers.onContextMenu({ date: startOfWeekDate, event, granularity: 'week' })}
		on:pointerenter={(event) => {
			eventHandlers.onHover({
				date: startOfWeekDate,
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				granularity: 'week'
			});
		}}
	>
		{weekNum}
		<Dot isFilled={!!file} isActive={!!file} />
	</button>
	<Sticker {sticker} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	td {
		border-right: 1px solid var(--background-modifier-border);
	}
</style>
