<script lang="ts">
	import { setIcon } from 'obsidian';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let isExpanded: boolean;
	let arrowEl: HTMLElement;

	onMount(() => {
		setIcon(arrowEl, 'chevron-right');
	});
</script>

<div
	bind:this={arrowEl}
	class="inline-flex items-center mr-2 transition-transform duration-200 ease-in"
	class:transform={isExpanded}
	class:rotate-90={isExpanded}
	transition:fade
/>
