<script lang="ts">
	import clsx from 'clsx'
	export let variable: number;
	export let popup: boolean = false;
</script>

<div class={clsx("space-y-4", popup && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')} data-popup={popup && 'calendarPopup'}>
	<div class="space-y-2">
		<p class="text-2xl text-[--text-accent]">My number is {variable}!</p>
		<p class="text-[--text-muted]">Hello calendar!</p>
	</div>

	<div class="space-x-2">
		<button class="px-4 py-1" on:click={() => (variable -= 1)}>-</button>
		<button class="px-4 py-1" on:click={() => (variable += 1)}>+</button>
	</div>
</div>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
