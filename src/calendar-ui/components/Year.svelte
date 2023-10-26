<svelte:options immutable />

<script lang="ts">
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { VIEW } from '../context';
	import { isMetaPressed } from '../utils';
	import type { ICalendarViewCtx } from '@/view';
	import { getNoteByGranularity } from '@/calendar-io';
	import { displayedDateStore, rerenderStore } from '@/stores';
	import type { Moment } from 'moment';

	export let year: number;
	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	let date: Moment;
	$: $displayedDateStore, (date = window.moment().clone().year(year).startOf('year'));
</script>

<td>
	<button
		on:click={(event) =>
			eventHandlers.onClick({
				date,
				isNewSplit: isMetaPressed(event),
				granularity: 'year'
			})}
		on:contextmenu={(event) =>
			eventHandlers.onContextMenu({
				date,
				event,
				granularity: 'year'
			})}
		on:pointerenter={(event) => {
			eventHandlers.onHover({
				date,
				targetEl: event.target,
				isMetaPressed: isMetaPressed(event),
				granularity: 'year'
			});
		}}>{year}</button
	>

	{#if $rerenderStore && getNoteByGranularity({ date, granularity: 'year' })}
		<Dot />
	{/if}
</td>
