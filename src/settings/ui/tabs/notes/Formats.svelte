<script lang="ts">
	import { type IGranularity } from '@/io';
	import { type PeriodSettings } from '@/settings';
	import { type Writable } from 'svelte/store';
	import Format from './Format.svelte';
	import { onMount } from 'svelte';
	export let granularity: IGranularity;
	export let settings: Writable<PeriodSettings>;

	$: crrFormat = $settings.format;

	onMount(() => {
		console.log(`📅 Formats ~ onMount ~ ${granularity} ~ ${crrFormat}`);
	});
</script>

<div class="setting-item flex flex-col">
	<div class="flex justify-between mr-0 w-full">
		<div class="setting-item-info">
			<div class="setting-item-name">Format</div>
			<div class="setting-item-description">
				<a href="https://momentjs.com/docs/#/displaying/format/">Syntax Reference</a>
			</div>
		</div>
		<div>
			{#if crrFormat}
				<p>Current format: {crrFormat}</p>
				<p class="u-pop">Preview: {window.moment().format(crrFormat)}</p>
			{:else}
				<p class="u-pop">Empty format</p>
			{/if}
		</div>
	</div>
	<form
		class="w-full"
		on:submit={(e) => {
			e.preventDefault();
		}}
	>
		<fieldset role="radiogroup" aria-label="Date format selection" class="border-none p-0 m-0">
			<legend class="sr-only">Choose a date format</legend>
			{#each $settings.formats as format, index (format.id)}
				<Format {index} {settings} {format} {granularity} />
			{/each}
			<Format {settings} type="skeleton" />
		</fieldset>
	</form>
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
