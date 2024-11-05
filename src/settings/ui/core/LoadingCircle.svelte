<script lang="ts">
	import { run } from 'svelte/legacy';

	import { cn } from '@/ui/utils';
	import { setIcon } from 'obsidian';

	let loadingIcon: HTMLElement = $state();
	interface Props {
		loading?: boolean;
	}

	let { loading = false }: Props = $props();

	run(() => {
		if (loading) {
			loadingIcon && setIcon(loadingIcon, 'loader-circle');
		}
	});
</script>

<div
	class={cn(
		'absolute opacity-0 -z-10',
		loading && 'opacity-100 z-10 left-1/2 top-1/2 [transform:translate(-50%,-50%)] leading-[0]'
	)}
>
	<div bind:this={loadingIcon} class="animate-spin"></div>
</div>

<style lang="postcss">
	@tailwind base;
	@tailwind utilities;
</style>
