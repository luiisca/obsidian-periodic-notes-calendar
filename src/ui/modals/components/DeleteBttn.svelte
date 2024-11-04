<script lang="ts">
	import { LoadingCircle } from '@/settings';
	import clsx from 'clsx';
	import { setIcon } from 'obsidian';
	import { onMount } from 'svelte';

	export let onClick: () => void;
	export let ariaLabel: string = 'Delete note';
	export let text: string = '';
	export let loading: boolean = false;

	let deleteBttnEl: HTMLElement;
	onMount(() => {
		setIcon(deleteBttnEl, 'lucide-trash-2');
	});
</script>

<div
	class={clsx(
		'relative menu-item tappable is-warning text-xs flex items-center',
		loading
			? 'opacity-60 hover:bg-transparent cursor-not-allowed '
			: 'hover:bg-[var(--background-modifier-hover)] cursor-pointer'
	)}
	aria-label={ariaLabel}
	on:click={(e) => {
		e.stopPropagation();
		!loading && onClick();
	}}
>
	<LoadingCircle {loading} />
	<div class="menu-item-icon" bind:this={deleteBttnEl} />
	{#if text}
		<span>{text}</span>
	{/if}
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
