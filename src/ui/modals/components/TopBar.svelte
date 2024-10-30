<script lang="ts">
	import DeleteBttn from './DeleteBttn.svelte';

	export let onDelete: () => void;
</script>

<div class="flex justify-between items-center p-[24px] pb-0">
	<span class="font-medium">Notes</span>
	<DeleteBttn onClick={onDelete} ariaLabel="Delete all notes" text="Delete all" />
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
