<script lang="ts">
	export let emoji: string | null;
</script>

{#if emoji}
	<div class="rotate-12 absolute top-0 left-full -translate-x-1/2 -translate-y-1/2">{emoji}</div>
{/if}

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
