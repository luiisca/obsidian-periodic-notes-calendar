<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';
	import { getContext } from 'svelte';

	import Dot from './Dot.svelte';
	import { VIEW } from '../context';
	import { isMetaPressed } from '../utils';
	import { getDateUID } from '@/calendar-io';
	import { activeFileIdStore, displayedDateStore, notesStores } from '@/stores/';
	import Sticker from './Sticker.svelte';
	import type { ICalendarViewCtx } from '@/types/view';

	// Properties
	export let date: Moment;

	const { eventHandlers } = getContext<ICalendarViewCtx>(VIEW);

	// update today value in case the displayed date changes and the current date is no longer today
	let today: Moment;
	$: $displayedDateStore, (today = window.moment());

	const notesStore = notesStores['day'];
	const dateUID = getDateUID({ date, granularity: 'day' });
	$: file = $notesStore[dateUID]?.file;
	$: sticker = $notesStore[dateUID]?.sticker;

	$: isActive = $activeFileIdStore === dateUID;
	$: isToday = date.isSame(today, 'day');
	$: isAdjacentMonth = !date.isSame($displayedDateStore, 'month');
</script>

<td class="relative">
	<button
		class:active={isActive}
		class:today={isToday}
		class:adjacent-month={isAdjacentMonth}
		class="[&:not(:focus-visible)]:shadow-none !h-auto w-full flex flex-col font-semibold rounded-[--radius-s] text-sm px-1 py-3 relative text-center tabular-nums transition-colors day"
		id='day'
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
		<Dot class="absolute bottom-1" isFilled={!!file} isVisible={!!file} />
	</button>
	<Sticker {sticker} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	.day {
		@apply text-[--text-normal] hover:bg-[--interactive-hover];
	}
	.day.active {
		@apply text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover];
	}
	.day.today {
		@apply text-[--color-text-today];
	}
	.day.active.today {
		@apply text-[--text-on-accent];
	}
	.day.adjacent-month {
		@apply opacity-25;
	}
</style>
