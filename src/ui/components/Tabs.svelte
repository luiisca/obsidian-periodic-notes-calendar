<script lang="ts">
	import clsx from 'clsx';
	import { capitalize } from '@/utils';

	export let tabs: string[] = [];
	export let selectedTab: string;
	export let id: string | undefined = undefined;
	export let tabId: string | undefined = undefined;
</script>

<div
	class="flex rounded-[--tab-curve] mx-auto w-full max-w-xs space-x-1 p-1 bg-[--background-modifier-hover]"
	{id}
>
	{#each tabs as tab}
		<button
			class={clsx(
				'[&:not(:focus-visible)]:shadow-none w-full rounded-[--radius-s] py-2 transition',
				selectedTab === tab
					? 'text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover]'
					: 'text-[--icon-color] opacity-[--icon-opacity] hover:opacity-[--icon-opacity-hover] hover:text-[--icon-color-hover] hover:bg-[--background-modifier-hover]'
			)}
			id={tabId}
			on:click={() => (selectedTab = tab)}>{capitalize(tab)}</button
		>
	{/each}
</div>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
