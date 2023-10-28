<svelte:options immutable />

<script lang="ts">
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { isMetaPressed } from '../utils';
	import { getDateUID, getNoteByGranularity } from '@/calendar-io';
	import type { ICalendarViewCtx } from '@/view';
	import { VIEW } from '../context';
	import { displayedDateStore, notesStores, rerenderStore } from '@/stores';
	import EmojiSticker from './EmojiSticker.svelte';

	export let quarterNum: number;

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);
	const date = $displayedDateStore.clone().quarter(quarterNum).startOf('quarter');

	let emoji: string | null = null;
	const notesStore = notesStores['quarter'];
	const dateUID = getDateUID(date, 'quarter');
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
