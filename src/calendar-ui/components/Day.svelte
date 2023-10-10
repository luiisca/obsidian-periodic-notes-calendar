<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';
	import type { TFile } from 'obsidian';
	import { createEventDispatcher, getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	import Dots from './Dots.svelte';
	import MetadataResolver from './MetadataResolver.svelte';
	import { DISPLAYED_MONTH, IS_MOBILE, VIEW } from '../context';
	import type { IDayMetadata, IHTMLAttributes, ISourceSettings } from '../types';
	import { isMetaPressed } from '../utils';
	import type { CalendarView, ICalendarViewCtx } from '@/view';

	// Properties
	export let date: Moment;
	// export let fileCache: PeriodicNotesCache;

	let file: TFile | null;

	// Global state
	const isMobile = getContext<boolean>(IS_MOBILE);
	const displayedMonth = getContext<Writable<Moment>>(DISPLAYED_MONTH);
	const dispatch = createEventDispatcher();

	const {
		eventHandlers: { day: eventHandlers }
	} = getContext<ICalendarViewCtx>(VIEW);

	// fileCache.store.subscribe(() => {
	// 	file = fileCache.getFile(date, 'day');
	// });

	// TODO: look at onHover structure and remove unncesary stuff
	// function handleHover(event: PointerEvent, meta: IDayMetadata) {
	//   onHover?.("day", date, file, event.target, isMetaPressed(event));
	//   dispatch("hoverDay", {
	//     date,
	//     metadata: meta,
	//     target: event.target,
	//   });
	// }

	// function endHover(event: MouseEvent) {
	//   dispatch("endHoverDay", {
	//     target: event.target,
	//   });
	// }

	// function handleContextmenu(event: MouseEvent) {
	//   onContextMenu?.("day", date, file, event);
	//   endHover(event);
	// }

	// function getAttributes(metadata: IDayMetadata[]): IHTMLAttributes {
	//   if (!metadata) {
	//     return {};
	//   }
	//   return metadata
	//     .filter((meta) => meta.display === "calendar-and-menu")
	//     .reduce((acc, meta) => {
	//       return {
	//         ...acc,
	//         ...meta.attrs,
	//       };
	//     }, {});
	// }
</script>

<td>
	<!-- <MetadataResolver metadata="{metadata}" let:metadata>
    <div
      class="day"
      class:active="{selectedId === getDateUID(date, 'day')}"
      class:adjacent-month="{!date.isSame($displayedMonth, 'month')}"
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
		class="day"
		on:click={(event) => eventHandlers.onClick({ date, isNewSplit: isMetaPressed(event) })}
	>
		{date.format('D')}
		<!-- <Dots metadata="{metadata}" /> -->
	</button>
</td>

<style>
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
