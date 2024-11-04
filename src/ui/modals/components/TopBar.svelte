<script lang="ts">
	import { Writable } from 'svelte/store';
	import DeleteBttn from './DeleteBttn.svelte';
	import clsx from 'clsx';

	export let onDelete: () => void;
	export let deletingAllStore: Writable<boolean>;
</script>

<div class="flex justify-between items-center p-[24px] pb-0">
	<span class={clsx('font-medium', $deletingAllStore && 'opacity-60')}>Notes</span>
	<DeleteBttn
		loading={$deletingAllStore}
		onClick={onDelete}
		ariaLabel="Delete all notes"
		text="Delete all"
	/>
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
