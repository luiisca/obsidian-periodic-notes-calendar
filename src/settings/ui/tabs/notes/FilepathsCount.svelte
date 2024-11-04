<script lang="ts">
	import { settingsStore, type PeriodSettings } from '@/settings';
	import { FilepathModal } from '@/ui/modals/filepath-select';
	import clsx from 'clsx';
	import { setIcon } from 'obsidian';

	export let format: PeriodSettings['formats'][number];
	export let selected: boolean = false;
	export let error: string = '';
	export let separator: string = ' • ';

	let loadingIcon: HTMLElement;
	$: filepaths = $settingsStore.filepathsByFormatValue[format.value] || {};
	$: filesCount = Object.keys(filepaths).length;
	$: _selected = selected;

	function handleShowFiles(filepaths: string[]) {
		new FilepathModal(filepaths, format.value).open();
	}

	$: if (format.loading) {
		loadingIcon && setIcon(loadingIcon, 'loader-circle');
	}
</script>

{#if filesCount || format.loading}
	<div class="relative inline-flex">
		<div
			class={clsx(
				'absolute opacity-0 -z-10',
				format.loading &&
					'opacity-100 z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 leading-[0]'
			)}
		>
			<div bind:this={loadingIcon} class="animate-spin" />
		</div>
		<a
			class={clsx(
				'[font-size:calc(var(--font-ui-small)+1px)] focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)]',
				error
					? 'text-[var(--text-error)] hover:opacity-85'
					: _selected
					? 'opacity-100 hover:opacity-85 text-[var(--text-on-accent)]'
					: '',
				format.loading && 'opacity-60'
			)}
			href={'#'}
			on:click={() => handleShowFiles(Object.keys(filepaths))}
			>{filesCount || '-'} {filesCount === 1 ? 'File' : 'Files'}</a
		>
	</div>
	{separator}
{/if}

<style lang="postcss">
	@tailwind utilities;
</style>
