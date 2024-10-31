<script lang="ts">
	import { settingsStore, type PeriodSettings } from '@/settings';
	import { FilepathModal } from '@/ui/modals/filepath-select';
	import clsx from 'clsx';

	export let format: PeriodSettings['formats'][number];
	export let selected: boolean = false;
	export let separator: string = ' • ';
	$: filepaths = $settingsStore.filepathsByFormatValue[format.value] || {};
	$: filesCount = Object.keys(filepaths).length;
	$: _selected = selected;

	function handleShowFiles(filepaths: string[]) {
		new FilepathModal(filepaths).open();
	}
</script>

{#if filesCount}
	<a
		class={clsx(
			'focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)]',
			_selected ? 'opacity-100 hover:opacity-85 text-[var(--text-on-accent)]' : ''
		)}
		href={'#'}
		on:click={() => handleShowFiles(Object.keys(filepaths))}
		>{filesCount} {filesCount === 1 ? 'File' : 'Files'}</a
	>{separator}
{/if}

<style lang="postcss">
	@tailwind utilities;
</style>
