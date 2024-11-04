<script lang="ts">
	import clsx from 'clsx';
	import { setIcon } from 'obsidian';

	let loadingIcon: HTMLElement;
	export let loading: boolean = false;

	$: if (loading) {
		loadingIcon && setIcon(loadingIcon, 'loader-circle');
	}
</script>

<div
	class={clsx(
		'absolute opacity-0 -z-10',
		loading && 'opacity-100 z-10 left-1/2 top-1/2 [transform:translate(-50%,-50%)] leading-[0]'
	)}
>
	<div bind:this={loadingIcon} class="animate-spin" />
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
