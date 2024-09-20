<svelte:options immutable />

<script lang="ts">
	import { getNoteDateUID } from '@/io';
	import { displayedDateStore, notesStores } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';

	export let monthIndex: number;

	const notesStore = notesStores['month'];

	$: date = $displayedDateStore.clone().month(monthIndex).startOf('month');
	$: noteDateUID = getNoteDateUID({ date, granularity: 'month' });

	$: file = $notesStore[noteDateUID]?.file;
	$: sticker = $notesStore[noteDateUID]?.sticker;
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
				date,
				event,
				granularity: 'month'
			})}
		on:pointerenter={(event) =>
			eventHandlers.onHover({
				date,
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				granularity: 'month'
			})}
	>
		{$displayedDateStore.clone().month(monthIndex).format('MMMM')}
		<Dot isFilled={!!file} isActive={!!file} />
	</button>

	<Sticker {sticker} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
