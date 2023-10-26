<svelte:options immutable />

<script lang="ts">
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { isMetaPressed } from '../utils';
	import { getNoteByGranularity } from '@/calendar-io';
	import type { ICalendarViewCtx } from '@/view';
	import { VIEW } from '../context';
	import { displayedDateStore, rerenderStore } from '@/stores';

	export let quarterNum: number;

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);
	const date = $displayedDateStore
		.clone()
		.quarter(quarterNum)
		.startOf('quarter');
</script>

<td>
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
			})}>Q{quarterNum}</button
	>

	{#if $rerenderStore && getNoteByGranularity({ date, granularity: 'quarter' })}
		<Dot />
	{/if}
</td>

<style>
</style>
