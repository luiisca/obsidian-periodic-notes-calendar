<svelte:options immutable />

<script lang="ts">
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { VIEW } from '../context';
	import { isMetaPressed } from '../utils';
	import { getDateUID } from '@/calendar-io';
	import { displayedDateStore, notesStores } from '@/stores';
	import Sticker from './Sticker.svelte';
	import type { ICalendarViewCtx } from '@/types/view';

	export let year: number;
	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

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
				isNewSplit: isMetaPressed(event),
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
				isMetaPressed: isMetaPressed(event),
				granularity: 'year'
			});
		}}
	>
		{year}
		<Dot isFilled={!!file} isVisible={!!file} />
	</button>

	<Sticker {sticker} />
</td>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
