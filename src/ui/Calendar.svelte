<script lang="ts">
	import clsx from 'clsx';
	import type { Moment } from 'moment';
	import { Calendar as CalendarBase } from 'obsidian-calendar-ui';
	import { onDestroy } from 'svelte';
	import type { ISettings } from '../settings';
	import { settingsStore } from './stores';
	import type { App } from 'obsidian';


	let date: Moment;

	$: date = getDate($settingsStore);

	function getDate(settings: ISettings) {
		return window.moment();
	}

	export let displayedDate: Moment = date;
	export let popup: boolean = false;
	export let app: App;

	// onDestroy(() => {
	// 	clearInterval(heartbeat);
	// });
</script>

<div
	class={clsx(
		'space-y-4',
		popup && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300'
	)}
	data-popup={popup && 'calendarPopup'}
>
	<CalendarBase
		{app}
		showWeekNums={true}
		localeData={date.localeData()}
		eventHandlers={[
			function onClickDay() {
				console.log('CLIKCED DAY! 📅');
			}
		]}
		bind:displayedDate
		getSourceSettings={() => ({
			color: 'red',
			display: 'calendar-and-menu',
			order: 1,
		})}
	/>
</div>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
