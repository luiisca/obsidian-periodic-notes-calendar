<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { VIEW } from '../context';
	import { isMetaPressed } from '../utils';
	import type { ICalendarViewCtx } from '@/view';
	import { getDateUID, getNoteByGranularity } from '@/calendar-io';
	import { notesStores, rerenderStore } from '@/stores';
	import EmojiSticker from './EmojiSticker.svelte';

	// Properties
	export let date: Moment;

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	let emoji: string | null = null;
	const notesStore = notesStores['day'];
	const dateUID = getDateUID(date, 'day');
	$: emoji = $notesStore[dateUID]?.sticker;
</script>

<td class="relative">
	<!-- <MetadataResolver metadata="{metadata}" let:metadata>
    <div
      class="day"
      class:active="{selectedId === getDateUID(date, 'day')}"
      class:adjacent-month="{!date.isSame($displayedDateStore, 'month')}"
      class:has-note="{!!file}"
      class:today="{date.isSame(today, 'day')}"
      draggable="{true}"
      {...getAttributes(metadata)}
      on:click="{(event) => handleClick(event, metadata)}"
      on:contextmenu="{handleContextmenu}"
      on:pointerenter="{(event) => handleHover(event, metadata)}"
      on:pointerleave="{endHover}"
      on:dragstart="{(event) => fileCache.onDragStart(event, file)}"
    >
      {date.format("D")}
      <Dots metadata="{metadata}" />
    </div>
  </MetadataResolver> -->
	<button
		class="day w-full flex flex-col"
		on:click={(event) =>
			eventHandlers.onClick({ date, isNewSplit: isMetaPressed(event), granularity: 'day' })}
		on:contextmenu={(event) => eventHandlers.onContextMenu({ date, event, granularity: 'day' })}
		on:pointerenter={(event) => {
			eventHandlers.onHover({
				date,
				targetEl: event.target,
				isMetaPressed: isMetaPressed(event),
				granularity: 'day'
			});
		}}
	>
		{date.format('D')}
		{#if $rerenderStore && getNoteByGranularity({ date, granularity: 'day' })}
			<Dot isFilled />
		{/if}
	</button>
	<EmojiSticker {emoji} />
</td>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
	.day {
		background-color: var(--color-background-day);
		border-radius: 4px;
		color: var(--color-text-day);
		cursor: pointer;
		font-size: 0.8em;
		height: 100%;
		padding: 4px;
		position: relative;
		text-align: center;
		transition: background-color 0.1s ease-in, color 0.1s ease-in;
		vertical-align: baseline;
	}
	.day:hover {
		background-color: var(--interactive-hover);
	}

	.day.active:hover {
		background-color: var(--interactive-accent-hover);
	}

	.adjacent-month {
		opacity: 0.25;
	}

	.today {
		color: var(--color-text-today);
	}

	.day:active,
	.active,
	.active.today {
		color: var(--text-on-accent);
		background-color: var(--interactive-accent);
	}
</style>
