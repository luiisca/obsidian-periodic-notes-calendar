<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { isMetaPressed } from '../utils';
	import { getDateUID } from '@/calendar-io';
	import { VIEW } from '../context';
	import { notesStores } from '@/stores';
	import Sticker from './Sticker.svelte';
	import type { ICalendarViewCtx } from '@/types/view';

	// Properties
	export let weekNum: number;
	export let startOfWeekDate: Moment;

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	const notesStore = notesStores['week'];
	const dateUID = getDateUID({ date: startOfWeekDate, granularity: 'week' });
	$: file = $notesStore[dateUID]?.file;
	$: sticker = $notesStore[dateUID]?.sticker;
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
		<Dot isFilled={!!file} isVisible={!!file} />
	</button>
	<Sticker {sticker} />
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
