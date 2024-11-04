<script lang="ts">
	import { getPeriodicityFromGranularity, type IGranularity } from '@/io';
	import { settingsStore } from '@/settings';
	import { Arrow, Toggle } from '@/settings/ui/';
	import { capitalize } from '@/utils';
	import writableDerived from 'svelte-writable-derived';
	import { slide } from 'svelte/transition';
	import Folder from './Folder.svelte';
	import Template from './Template.svelte';
	import OpenAtStartup from './OpenAtStartup.svelte';
	import Formats from './Formats.svelte';

	export let granularity: IGranularity;

	let isExpanded = false;

	let settings = writableDerived(
		settingsStore,
		// get derived store from settingsStore
		($settingsStore) => $settingsStore.periods[granularity],
		// update settingsStore when the derived store changes
		(reflecting, old) => {
			const newSettings = {
				...old,
				periods: {
					...old.periods,
					[granularity]: reflecting
				}
			};

			return newSettings;
		}
	);

	function toggleExpand(event: Event) {
		if ((event.target as HTMLElement)?.matches('input, label')) return;

		isExpanded = !isExpanded;
	}
</script>

<div
	class="bg-[var(--background-primary-alt)] border border-solid border-[var(--background-modifier-border)] rounded-2xl mb-6 last:mb-0"
>
	<a
		href="./"
		class="setting-item setting-item-heading text-transparent p-6 cursor-pointer flex items-center justify-between focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)] outline-none"
		on:click={toggleExpand}
	>
		<div class="setting-item-info flex justify-between items-center">
			<h3 class="setting-item-name flex items-center text-lg font-semibold">
				<Arrow {isExpanded} />
				<span class="ml-2">
					{capitalize(getPeriodicityFromGranularity(granularity))} Notes
				</span>
				{#if $settings.openAtStartup}
					<span class="ml-4 mt-1 text-[var(--text-muted)] text-xs italic font-medium"
						>Opens at startup</span
					>
				{/if}
			</h3>
		</div>
		<div class="setting-item-control">
			<Toggle isEnabled={$settings.enabled} onChange={(val) => ($settings.enabled = val)} />
		</div>
	</a>
	{#if isExpanded}
		<div class="p-6" in:slide|local={{ duration: 300 }} out:slide|local={{ duration: 300 }}>
			<Formats {settings} {granularity} />
			<Folder {settings} {granularity} />
			<Template {settings} />
			<OpenAtStartup {settings} {granularity} />
		</div>
	{/if}
</div>

<style lang="postcss">
	@tailwind base;
	@tailwind utilities;
</style>
