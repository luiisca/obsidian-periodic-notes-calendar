<script lang="ts">
	import DeleteBttn from './DeleteBttn.svelte';

	export let filepath: string = '';
	export let onDelete: () => void;

	const basename = filepath.split('/').pop() || '';
	const path = filepath.substring(0, filepath.lastIndexOf('/'));
</script>

<div class="py-1 px-0 flex justify-between items-center">
	<div class="flex items-end">
		<span class="font-medium">{basename}</span>
		{#if path.includes('/')}
			<span class="opacity-70 text-sm h-4 ml-1">in {path}</span>
		{/if}
	</div>
	<DeleteBttn onClick={onDelete} />
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
