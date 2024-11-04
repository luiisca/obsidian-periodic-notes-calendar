<script lang="ts">
	import { LoadingCircle, settingsStore, type PeriodSettings } from '@/settings';
	import { FilepathModal } from '@/ui/modals/filepath-select';
	import clsx from 'clsx';

	export let format: PeriodSettings['formats'][number];
	export let selected: boolean = false;
	export let error: string = '';
	export let separator: string = ' • ';

	$: filepaths = $settingsStore.filepathsByFormatValue[format.value] || {};
	$: filesCount = Object.keys(filepaths).length;
	$: _selected = selected;

	function handleShowFiles(filepaths: string[]) {
		new FilepathModal(filepaths, format.value).open();
	}
</script>

{#if filesCount || format.loading}
	<div class="relative inline-flex">
		<LoadingCircle loading={format.loading} />
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

