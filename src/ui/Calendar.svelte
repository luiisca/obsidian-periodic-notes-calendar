<script lang="ts">
	import clsx from 'clsx';

	export let popup: boolean = false;
</script>

<div
	class={clsx(
		'space-y-4',
		popup && 'w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300'
	)}
	data-popup={popup && 'calendarPopup'}
>
	<div class="space-y-2">
		{#if popup}
			<p>Hey I'm a popup</p>
		{/if}
		<p class="text-[--text-muted]">Hello calendar!</p>
	</div>
</div>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
