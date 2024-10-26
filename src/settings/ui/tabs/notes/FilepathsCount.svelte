<script lang="ts">
	import { settingsStore, type PeriodSettings } from '@/settings';
	import { FilepathModal } from '@/ui/modals/filepath-select';

	export let format: PeriodSettings['formats'][number];
	$: filepaths = $settingsStore.filepathsByFormatValue[format.value] || {};
	$: filesCount = Object.keys(filepaths).length;

	function handleShowFiles(filepaths: string[]) {
		new FilepathModal(filepaths).open();
	}
</script>

{#if filesCount}
	<span
		><a href={null} on:click={() => handleShowFiles(Object.keys(filepaths))}
			>{filesCount} {filesCount === 1 ? 'File' : 'Files'}</a
		> •
	</span>
{/if}
