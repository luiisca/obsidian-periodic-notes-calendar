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

	export let monthIndex: number;
	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	const notesStore = notesStores['month'];

	$: date = $displayedDateStore.clone().month(monthIndex).startOf('month');
	$: dateUID = getDateUID({ date, granularity: 'month' });

	$: file = $notesStore[dateUID]?.file;
	$: sticker = $notesStore[dateUID]?.sticker;
</script>

<td class="relative">
	<button
		on:click={(event) =>
			eventHandlers.onClick({
				date,
				isNewSplit: isMetaPressed(event),
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
				isMetaPressed: isMetaPressed(event),
				granularity: 'month'
			})}
	>
		{$displayedDateStore.clone().month(monthIndex).format('MMMM')}
		<Dot isFilled={!!file} isVisible={!!file} />
	</button>

	<Sticker {sticker} />
</td>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
