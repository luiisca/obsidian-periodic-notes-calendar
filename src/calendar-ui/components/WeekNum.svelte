<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';
	import type { TFile } from 'obsidian';
	import { createEventDispatcher, getContext } from 'svelte';

	import Dots from './Dots.svelte';
	import type PeriodicNotesCache from '../fileStore';
	import MetadataResolver from './MetadataResolver.svelte';
	import type { IDayMetadata, ISourceSettings } from '../types';
	import { getStartOfWeek, isMetaPressed } from '../utils';
	import type { IGranularity } from '@/calendar-io';
	import type { ICalendarViewCtx } from '@/view';
	import { VIEW } from '../context';

	// Properties
	export let weekNum: number;
	export let startOfWeekDate: Moment;

	// Global state;
	// export let selectedId: string = null;

	// let file: TFile | null;
	// let startOfWeek: Moment;
	// let metadata: Promise<IDayMetadata[]> | null;

	// const dispatch = createEventDispatcher();

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	// TODO: find a way to open link preview using vanilla featuers
	// function handleHover(event: PointerEvent, meta: IDayMetadata) {
	//   onHover?.("week", days[0], file, event.target, isMetaPressed(event));
	//   dispatch("hoverDay", {
	//     date: days[0],
	//     metadata: meta,
	//     target: event.target,
	//   });
	// }

	// function endHover(event: PointerEvent) {
	//   dispatch("endHoverDay", {
	//     target: event.target,
	//   });
	// }
</script>

<td>
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
		on:contextmenu={(event) => eventHandlers.onContextMenu({ date: startOfWeekDate, event, granularity: 'week' })}
	>
		{weekNum}
		<!-- <Dots metadata="{metadata}" /> -->
	</button>
</td>

<style>
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
