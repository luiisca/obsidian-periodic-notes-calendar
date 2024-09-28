<script lang="ts">
	import { getPeriodicityFromGranularity, IGranularity } from '@/io';
	import { settingsStore } from '@/settings';
	import { capitalize } from '@/utils';
	import writableDerived from 'svelte-writable-derived';
	import { slide } from 'svelte/transition';
	import Arrow from './Arrow.svelte';
	import Format from './Format.svelte';
	import Folder from './Folder.svelte';

	let isExpanded = false;
	export let granularity: IGranularity;

	let settings = writableDerived(
		settingsStore,
		// get derived store from settingsStore
		($settingsStore) => $settingsStore.notes[granularity],
		// update settingsStore when the derived store changes
		(reflecting, old) => {
			const newSettings = {
				...old,
				notes: {
					...old.notes,
					[granularity]: reflecting
				}
			};

			return newSettings;
		}
	);

	function toggleExpand() {
		isExpanded = !isExpanded;
	}
</script>

<div class="bg-gray-100 border border-gray-300 rounded-2xl mb-6 last:mb-0">
	<a
		href="./"
		class="setting-item setting-item-heading text-transparent p-6 cursor-pointer flex items-center justify-between"
		on:click={toggleExpand}
	>
		<div class="setting-item-info flex items-center">
			<Arrow {isExpanded} />
			<h3 class="setting-item-name text-lg font-semibold ml-2">
				{capitalize(getPeriodicityFromGranularity(granularity))} Notes
				{#if $settings.openAtStartup}
					<span class="ml-4 text-sm italic text-gray-500 font-medium">Opens at startup</span>
				{/if}
			</h3>
		</div>
		<div class="setting-item-control">
			<label class="checkbox-container relative inline-flex items-center cursor-pointer">
				<input type="checkbox" bind:checked={$settings.enabled} class="sr-only peer" />
				<div
					class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
				/>
			</label>
		</div>
	</a>
	{#if isExpanded}
		<div class="p-6" in:slide|local={{ duration: 300 }} out:slide|local={{ duration: 300 }}>
			<Format {settings} {granularity} />
			<Folder {settings} {granularity} />
			<!-- <NoteTemplateSetting {settings} {granularity} /> -->
			<!-- <OpenAtStartupSetting {settings} {granularity} /> -->
		</div>
	{/if}
</div>
