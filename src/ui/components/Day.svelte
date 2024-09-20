<svelte:options immutable />

<script lang="ts">
	import type { Moment } from 'moment';

	import { getNoteDateUID } from '@/io';
	import { activeFileIdStore, displayedDateStore, notesStores } from '@/stores/';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';

	// Properties
	export let date: Moment;

	// update today value in case the displayed date changes and the current date is no longer today
	let today: Moment;
	$: $displayedDateStore, (today = window.moment());

	const notesStore = notesStores['day'];
	const noteDateUID = getNoteDateUID({ date, granularity: 'day' });
	$: file = $notesStore[noteDateUID]?.file;
	$: sticker = $notesStore[noteDateUID]?.sticker;

	$: isActive = $activeFileIdStore === noteDateUID;
	$: isToday = date.isSame(today, 'day');
	$: isAdjacentMonth = !date.isSame($displayedDateStore, 'month');
</script>

<td class="relative">
	<button
		class:active={isActive}
		class:today={isToday}
		class:adjacent-month={isAdjacentMonth}
		class="[&:not(:focus-visible)]:shadow-none !h-auto w-full flex flex-col font-medium rounded-[--radius-s] text-sm px-1 py-3 relative text-center tabular-nums transition-colors day"
		id="day"
		on:click={(event) =>
			eventHandlers.onClick({
				date,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'day'
			})}
		on:contextmenu={(event) => eventHandlers.onContextMenu({ date, event, granularity: 'day' })}
		on:pointerenter={(event) => {
			eventHandlers.onHover({
				date,
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				granularity: 'day'
			});
		}}
	>
		{date.format('D')}
		<Dot className="absolute bottom-1" isVisible={!!file} isFilled={!!file} isActive={!!file} />
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
