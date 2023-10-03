<script lang="ts">
	import clsx from 'clsx';
	import { onDestroy } from 'svelte';
	// import type { ISettings } from '@/settings';
	// import { settingsStore } from '@/stores';
	import Calendar from './calendar-ui/components/Calendar.svelte'

	export let popup: boolean = false;

	// onDestroy(() => {
	// 	// clearInterval(heartbeat);
	// });
</script>

<div
	class={clsx(
		popup && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300'
	)}
	data-popup={popup && 'calendarPopup'}
>
	<Calendar />
</div>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
