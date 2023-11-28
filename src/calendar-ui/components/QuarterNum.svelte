<svelte:options immutable />

<script lang="ts">
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { isMetaPressed } from '../utils';
	import { getDateUID, getNoteByGranularity } from '@/calendar-io';
	import { VIEW } from '../context';
	import { displayedDateStore, notesStores, rerenderStore } from '@/stores';
	import EmojiSticker from './EmojiSticker.svelte';
	import type { Moment } from 'moment';
	import type { ICalendarViewCtx } from '@/types/view';

	export let quarterNum: number;
	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	let date: Moment;
	let dateUID: string;
	let emoji: string | null = null;
	const notesStore = notesStores['quarter'];

	$: date = $displayedDateStore.clone().quarter(quarterNum).startOf('quarter');

	$: dateUID = getDateUID({date, granularity: 'quarter'});
	$: emoji = $notesStore[dateUID]?.sticker;
</script>

<td class="relative">
	<button
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
		{#if $rerenderStore && getNoteByGranularity({ date, granularity: 'quarter' })}
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
