<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { isMetaPressed } from '../utils';
	import { getDateUID, getNoteByGranularity } from '@/calendar-io';
	import type { ICalendarViewCtx } from '@/view';
	import { VIEW } from '../context';
	import { notesStores, rerenderStore } from '@/stores';
	import EmojiSticker from './EmojiSticker.svelte';

	// Properties
	export let weekNum: number;
	export let startOfWeekDate: Moment;

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	let emoji: string | null = null;
	const notesStore = notesStores['week'];
	const dateUID = getDateUID(startOfWeekDate, 'week');
	$: emoji = $notesStore[dateUID]?.sticker;
</script>

<td class="relative">
	<!-- <MetadataResolver metadata="{metadata}" let:metadata>
    <div
      class="week-num"
      class:active="{selectedId === getDateUID(days[0], 'week')}"
      draggable="{true}"
      on:click="{onClick &&
        ((e) => onClick('week', startOfWeek, file, isMetaPressed(e)))}"
      on:contextmenu="{onContextMenu &&
        ((e) => onContextMenu('week', days[0], file, e))}"
      on:dragstart="{(event) => fileCache.onDragStart(event, file)}"
      on:pointerenter="{(event) => handleHover(event, metadata)}"
      on:pointerleave="{endHover}"
    >
      {weekNum}
      <Dots metadata="{metadata}" />
    </div>
  </MetadataResolver> -->
	<button
		class="day"
		on:click={(event) =>
			eventHandlers.onClick({
				date: startOfWeekDate,
				isNewSplit: isMetaPressed(event),
				granularity: 'week'
			})}
		on:contextmenu={(event) =>
			eventHandlers.onContextMenu({ date: startOfWeekDate, event, granularity: 'week' })}
		on:pointerenter={(event) => {
			eventHandlers.onHover({
				date: startOfWeekDate,
				targetEl: event.target,
				isMetaPressed: isMetaPressed(event),
				granularity: 'week'
			});
		}}
	>
		{weekNum}
		{#if $rerenderStore && getNoteByGranularity( { date: startOfWeekDate, granularity: 'week' } )}
			<Dot />
		{/if}
	</button>
	<EmojiSticker {emoji} />
</td>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	td {
		border-right: 1px solid var(--background-modifier-border);
	}

	.week-num {
		background-color: var(--color-background-weeknum);
		border-radius: 4px;
		color: var(--color-text-weeknum);
		cursor: pointer;
		font-size: 0.65em;
		height: 100%;
		padding: 4px;
		text-align: center;
		transition: background-color 0.1s ease-in, color 0.1s ease-in;
		vertical-align: baseline;
	}

	.week-num:hover {
		background-color: var(--interactive-hover);
	}

	.week-num.active:hover {
		background-color: var(--interactive-accent-hover);
	}

	.active {
		color: var(--text-on-accent);
		background-color: var(--interactive-accent);
	}
</style>
