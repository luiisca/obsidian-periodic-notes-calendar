<script lang="ts">
	import clsx from 'clsx';
	import { onDestroy } from 'svelte';
	import Calendar from './calendar-ui/components/Calendar.svelte';
	import { displayedDateStore, rerenderStore } from './stores';
	import type { Moment } from 'moment';

	export let popup: boolean = false;

	export function rerenderCalendar() {
		rerenderStore.update((val) => ({
			...val,
			rerender: true
		}));
	}

	let today: Moment = window.moment();

	let heartbeat = setInterval(() => {
		// update today
		today = window.moment();

		// update displayedDateStore to new current date only if new current date is one day ahead.
		// useful to update display with new current month, year or years range automatically
		if (today.isSame($displayedDateStore.clone().add(1, 'day'))) {
			console.log('⚙⚙⚙ RERENDERING CALENdAR ⚙⚙⚙️');

			displayedDateStore.set(today);
			rerenderCalendar();
		}
	}, 1000 * 60);

	onDestroy(() => {
		clearInterval(heartbeat);
	});
</script>

<div
	class={clsx(popup && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')}
	data-popup={popup && 'calendarPopup'}
>
	<Calendar />
</div>

<style>
	@tailwind components;
	@tailwind utilities;
</style>
