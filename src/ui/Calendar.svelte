<script lang="ts">
	import clsx from 'clsx';
	import type { Moment } from 'moment';
	import { Calendar as CalendarBase } from 'obsidian-calendar-ui';
	import { onDestroy } from 'svelte';
	import type { ISettings } from '../settings';
	import { settingsStore } from './stores';

	export let popup: boolean = false;

	let today: Moment;

	$: today = getToday($settingsStore);

	function getToday(settings: ISettings) {
		return window.moment();
	}

	onDestroy(() => {
		clearInterval(heartbeat);
	});
</script>

<div
	class={clsx(
		'space-y-4',
		popup && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300'
	)}
	data-popup={popup && 'calendarPopup'}
/>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
