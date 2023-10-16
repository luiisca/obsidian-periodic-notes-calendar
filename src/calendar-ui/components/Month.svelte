<script lang="ts">
	import type { Moment } from 'moment';
	import type { TFile } from 'obsidian';
	import { createEventDispatcher, getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	import { DISPLAYED_MONTH, VIEW } from '../context';
	import Dots from './Dots.svelte';
	import MetadataResolver from './MetadataResolver.svelte';
	import { isMetaPressed } from '../utils';
	import type { IDayMetadata, ISourceSettings } from '../types';
	import type { ICalendarViewCtx } from '@/view';

	// export let resetDisplayedMonth: () => void;

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);
	let displayedMonth = getContext<Writable<Moment>>(DISPLAYED_MONTH);

	let file: TFile | null;

	// function handleHover(event: PointerEvent, meta: IDayMetadata) {
	//   if (!appHasMonthlyNotesPluginLoaded()) {
	//     return;
	//   }

	//   const date = $displayedMonth;
	//   onHover?.("month", date, file, event.target, isMetaPressed(event));
	//   dispatch("hoverDay", {
	//     date,
	//     metadata: meta,
	//     target: event.target,
	//   });
	// }

	// function endHover(event: PointerEvent) {
	//   dispatch("endHoverDay", {
	//     target: event.target,
	//   });
	// }

	// function handleClick(event: MouseEvent) {
	//   if (appHasMonthlyNotesPluginLoaded()) {
	//     onClick?.("month", $displayedMonth, file, isMetaPressed(event));
	//   } else {
	//     resetDisplayedMonth();
	//   }
	// }
</script>

<!-- <MetadataResolver metadata="{metadata}" let:metadata>
  <div
    draggable="{true}"
    on:click="{handleClick}"
    on:contextmenu="{metadata &&
      onContextMenu &&
      ((e) => onContextMenu('month', $displayedMonth, file, e))}"
    on:dragstart="{(event) => fileCache.onDragStart(event, file)}"
    on:pointerenter="{(event) => handleHover(event, metadata)}"
    on:pointerleave="{endHover}"
  >
    <span class="title">
      <span class="month">
        {$displayedMonth.format("MMM")}
      </span>
      <span class="year">
        {$displayedMonth.format("YYYY")}
      </span>
    </span>
    {#if metadata}
      <Dots metadata="{metadata}" centered="{false}" />
    {/if}
  </div>
</MetadataResolver> -->
<button
	style="all:inherit"
	on:click={(event) => {
		console.log('Month clicked');
		eventHandlers.onClick({
			date: $displayedMonth,
			isNewSplit: isMetaPressed(event),
			granularity: 'month'
		});
	}}
>
	<span class="title">
		<span class="month">
			{$displayedMonth.format('MMM')}
		</span>
		<span class="year">
			{$displayedMonth.format('YYYY')}
		</span>
	</span>
</button>

<style>
	.title {
		color: var(--color-text-title);
		cursor: pointer;
		display: flex;
		font-size: 1.4em;
		gap: 0.3em;
		margin: 0;
	}

	.month {
		font-weight: 500;
	}

	.year {
		color: var(--interactive-accent);
	}
</style>
