<svelte:options immutable />

<script lang="ts">
	import { getDateUID } from '@/io';
	import { displayedDateStore, notesStores } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';

	export let year: number;

	const notesStore = notesStores['year'];

	$: date = $displayedDateStore.clone().year(year).startOf('year');

	$: dateUID = getDateUID({ date, granularity: 'year' });
	$: file = $notesStore[dateUID]?.file;
	$: sticker = $notesStore[dateUID]?.sticker;
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
				date,
				event,
				granularity: 'year'
			})}
		on:pointerenter={(event) => {
			eventHandlers.onHover({
				date,
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				granularity: 'year'
			});
		}}
	>
		{year}
		<Dot isFilled={!!file} isActive={!!file} />
	</button>

	<Sticker {sticker} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
