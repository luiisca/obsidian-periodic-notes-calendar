<svelte:options immutable />

<script lang="ts">
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { isMetaPressed } from '../utils';
	import { getDateUID } from '@/calendar-io';
	import { VIEW } from '../context';
	import { displayedDateStore, notesStores } from '@/stores';
	import Sticker from './Sticker.svelte';
	import type { ICalendarViewCtx } from '@/types/view';

	export let quarterNum: number;
	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	const notesStore = notesStores['quarter'];

	$: date = $displayedDateStore.clone().quarter(quarterNum).startOf('quarter');
	$: dateUID = getDateUID({ date, granularity: 'quarter' });
	$: file = $notesStore[dateUID]?.file;
	$: sticker = $notesStore[dateUID]?.sticker;
</script>

<td class="relative">
	<button
		id="period-num"
		on:click={(event) =>
			eventHandlers.onClick({
				date,
				isNewSplit: isMetaPressed(event),
				granularity: 'quarter'
			})}
		on:contextmenu={(event) =>
			eventHandlers.onContextMenu({
				date,
				event,
				granularity: 'quarter'
			})}
		on:pointerenter={(event) =>
			eventHandlers.onHover({
				date,
				targetEl: event.target,
				isMetaPressed: isMetaPressed(event),
				granularity: 'quarter'
			})}
	>
		Q{quarterNum}
		<Dot isFilled={!!file} isVisible={!!file} />
	</button>

	<Sticker {sticker} />
</td>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
