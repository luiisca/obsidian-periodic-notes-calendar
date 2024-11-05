<script lang="ts">
	interface Props {
		replacingFormat: string;
	}

	let { replacingFormat }: Props = $props();
</script>

<p class="mt-0">
	Replace all formats with <span class="u-pop">{replacingFormat}</span>?
</p>

<style lang="postcss">
	@tailwind base;
	@tailwind utilities;
</style>
