<script lang="ts">
	import { run } from 'svelte/legacy';

	import { STICKER_POPOVER_ID } from '@/constants';
	import { initializePicker } from '../utils';
	import { themeStore } from '@/stores';
	import { TFileData } from '@/io';

	interface Props {
		close: () => void;
		fileData: TFileData;
	}

	let { close, fileData }: Props = $props();
	// export let

	let pickerContainerEl: HTMLDivElement | null = $state(null);
	let pickerInitialized = $state(false);
	run(() => {
		const theme = $themeStore;
		pickerContainerEl && theme && initializePicker(pickerContainerEl, theme, fileData);
		if (!pickerInitialized && pickerContainerEl) {
			pickerInitialized = true;
		}
	});
</script>

<div
	class="bg-transparent z-20 w-max opacity-0 pointer-events-none absolute top-0 left-0"
	data-popover={true}
	id={STICKER_POPOVER_ID}
	bind:this={pickerContainerEl}
></div>

<style lang="postcss">
	@tailwind base;
	@tailwind utilities;

	#emoji-modal {
		padding: 0px;
		min-width: unset;
		width: unset !important;
	}
</style>
