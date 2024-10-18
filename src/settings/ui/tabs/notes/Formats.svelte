<script lang="ts">
	import { type IGranularity } from '@/io';
	import { type PeriodSettings } from '@/settings';
	import { type Writable } from 'svelte/store';
	import Format from './Format.svelte';
	export let granularity: IGranularity;
	export let settings: Writable<PeriodSettings>;

	$: selectedFormat = $settings.selectedFormat;

	function getExpectedTokens(granularity: IGranularity): string {
		const baseTokens = 'Y or y (year)';
		switch (granularity) {
			case 'quarter':
				return `${baseTokens}, Q (quarter)`;
			case 'month':
				return `${baseTokens}, M (month)`;
			case 'week':
				return `${baseTokens}, w or W (week)`;
			case 'day':
				return `${baseTokens}, M (month) and D (day)`;
			default:
				return baseTokens;
		}
	}
</script>

<div class="setting-item flex flex-col space-y-4">
	<div class="flex justify-between mr-0 w-full">
		<div class="setting-item-info">
			<div class="setting-item-name mb-2">Format</div>
			<div class="setting-item-description">
				<p class="mt-0 mb-1">
					Required tokens: <span class="u-pop">{getExpectedTokens(granularity)}</span>
				</p>
				<a href="https://momentjs.com/docs/#/displaying/format/">Syntax Reference</a>
			</div>
		</div>
		<div class="setting-item-description self-end text-end">
			{#if selectedFormat.value}
				<p class="mt-0 mb-1">Current format: <span class="u-pop">{selectedFormat.value}</span></p>
				<p class="m-0">
					Preview: <span class="u-pop">{window.moment().format(selectedFormat.value)}</span>
				</p>
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
