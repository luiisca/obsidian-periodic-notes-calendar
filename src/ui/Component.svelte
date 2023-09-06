<script lang="ts">
	export let variable: number;
</script>

<div class="space-y-4">
	<div class='space-y-2'>
		<p class="text-2xl text-[--text-accent]">My number is {variable}!</p>
		<p class='text-[--text-muted]'>Hello calendar!</p>
	</div>
	
	<div class='space-x-2'>
		<button class="px-4 py-1" on:click={() => variable -= 1}>-</button>
		<button class="px-4 py-1" on:click={() => variable += 1}>+</button>
	</div>
</div>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
