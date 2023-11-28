<svelte:options immutable />

<script lang="ts">
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { VIEW } from '../context';
	import { isMetaPressed } from '../utils';
	import type { ICalendarViewCtx } from '@/view';
	import { getDateUID, getNoteByGranularity } from '@/calendar-io';
	import { displayedDateStore, notesStores, rerenderStore } from '@/stores';
	import EmojiSticker from './EmojiSticker.svelte';
	import type { Moment } from 'moment';

	export let monthIndex: number;
	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	let date: Moment;
	let dateUID: string;
	let emoji: string | null = null;
	const notesStore = notesStores['month'];

	$: date = $displayedDateStore.clone().month(monthIndex).startOf('month');

	$: dateUID = getDateUID({date, granularity: 'month'});
	$: emoji = $notesStore[dateUID]?.sticker;
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
		{#if $rerenderStore && getNoteByGranularity({ date, granularity: 'month' })}
			<Dot />
		{/if}
	</button>

	<EmojiSticker {emoji} />
</td>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
