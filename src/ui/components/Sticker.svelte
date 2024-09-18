<script lang="ts">
	export let sticker: string | null;
</script>

{#if sticker}
	<div class="rotate-12 absolute top-0 left-full -translate-x-1/2 -translate-y-1/2" id="sticker">
		{sticker}
	</div>
{/if}

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
