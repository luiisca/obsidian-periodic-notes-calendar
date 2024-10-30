<script lang="ts">
	import { setIcon } from 'obsidian';
	import { onMount } from 'svelte';

	export let onClick: () => void;
	export let ariaLabel: string = 'Delete note';
	export let text: string = '';

	let deleteBttnEl: HTMLElement;
	onMount(() => {
		setIcon(deleteBttnEl, 'lucide-trash-2');
	});
</script>

<div
	class="menu-item tappable is-warning text-xs hover:bg-[var(--background-modifier-hover)] cursor-pointer flex items-center"
	aria-label={ariaLabel}
	on:click={(e) => {
		e.stopPropagation();
		onClick();
	}}
>
	{#if text}
		<span>{text}</span>
	{/if}
	<div class="menu-item-icon" bind:this={deleteBttnEl} />
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
