<script lang="ts">
	import Tabs from '@/ui/components/Tabs.svelte';
	import { Notes, Calendar } from '@/settings/ui';

	const tabs = ['calendar', 'notes'] as const;
	let selectedTab: (typeof tabs)[number] = 'notes';
</script>

<Tabs tabs={[...tabs]} bind:selectedTab />
<div class="mt-6">
	{#if selectedTab === 'calendar'}
		<Calendar />
	{:else if selectedTab === 'notes'}
		<Notes />
	{/if}
</div>

<style lang="postcss">
	@tailwind utilities;

	:global(.vertical-tab-content) {
		scrollbar-gutter: stable;
		padding-right: calc(1rem + 16px); /* 1rem (16px) for base padding + 16px for scrollbar */
	}
</style>
