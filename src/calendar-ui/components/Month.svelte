<script lang="ts">
	import type { Moment } from 'moment';
	import type { TFile } from 'obsidian';
	import { createEventDispatcher, getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	import { DISPLAYED_DATE, VIEW } from '../context';
	import Dots from './Dots.svelte';
	import MetadataResolver from './MetadataResolver.svelte';
	import { isMetaPressed } from '../utils';
	import type { IDayMetadata, ISourceSettings } from '../types';
	import type { ICalendarViewCtx } from '@/view';

	// export let resetdisplayedDate: () => void;

	
	let file: TFile | null;

	// function handleHover(event: PointerEvent, meta: IDayMetadata) {
	//   if (!appHasMonthlyNotesPluginLoaded()) {
	//     return;
	//   }

	//   const date = $displayedDate;
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
	//     onClick?.("month", $displayedDate, file, isMetaPressed(event));
	//   } else {
	//     resetdisplayedDate();
	//   }
	// }
</script>

<!-- <MetadataResolver metadata="{metadata}" let:metadata>
  <div
    draggable="{true}"
    on:click="{handleClick}"
    on:contextmenu="{metadata &&
      onContextMenu &&
      ((e) => onContextMenu('month', $displayedDate, file, e))}"
    on:dragstart="{(event) => fileCache.onDragStart(event, file)}"
    on:pointerenter="{(event) => handleHover(event, metadata)}"
    on:pointerleave="{endHover}"
  >
    <span class="title">
      <span class="month">
        {$displayedDate.format("MMM")}
      </span>
      <span class="year">
        {$displayedDate.format("YYYY")}
      </span>
    </span>
    {#if metadata}
      <Dots metadata="{metadata}" centered="{false}" />
    {/if}
  </div>
</MetadataResolver> -->


<style>

</style>
