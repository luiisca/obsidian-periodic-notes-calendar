<script lang="ts">
	import { capitalize } from '@/utils';
	import { cn } from '../utils/cn';

	interface Props {
		tabs?: string[];
		selectedTab: string;
		id?: string | undefined;
		tabId?: string | undefined;
		className?: string | null;
	}

	let {
		tabs = [],
		selectedTab = $bindable(),
		id = undefined,
		tabId = undefined,
		className = null
	}: Props = $props();
</script>

<div
	class={cn(
		'flex rounded-[--tab-curve] mx-auto w-full max-w-64 p-1 bg-[--background-modifier-hover]',
		className
	)}
	{id}
>
	{#each tabs as tab}
		<button
			class={cn(
				'[&:not(:focus-visible)]:shadow-none cursor-pointer w-full rounded-[--radius-s] py-2 mr-1 last:mr-0 transition',
				selectedTab === tab
					? 'text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover]'
					: 'text-[--icon-color] opacity-[--icon-opacity] hover:opacity-[--icon-opacity-hover] hover:text-[--icon-color-hover] hover:bg-[--background-modifier-hover]'
			)}
			id={tabId}
			onclick={() => (selectedTab = tab)}>{capitalize(tab)}</button
		>
	{/each}
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
