<svelte:options immutable />

<script lang="ts">
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { VIEW } from '../context';
	import { isMetaPressed } from '../utils';
	import type { ICalendarViewCtx } from '@/view';
	import { getDateUID, getNoteByGranularity } from '@/calendar-io';
	import { displayedDateStore, notesStores, rerenderStore } from '@/stores';
	import type { Moment } from 'moment';
	import EmojiSticker from './EmojiSticker.svelte';

	export let year: number;
	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	let date: Moment;
	let dateUID: string;
	let emoji: string | null = null;
	const notesStore = notesStores['year'];

	$: date = $displayedDateStore.clone().year(year).startOf('year');

	$: dateUID = getDateUID(date, 'year');
	$: emoji = $notesStore[dateUID]?.sticker;
</script>

<td class="relative">
	<button
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
		{#if $rerenderStore && getNoteByGranularity({ date, granularity: 'year' })}
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