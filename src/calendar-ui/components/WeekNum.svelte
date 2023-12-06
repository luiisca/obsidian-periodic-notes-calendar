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
	<button
		id="period-num"
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
</style>
