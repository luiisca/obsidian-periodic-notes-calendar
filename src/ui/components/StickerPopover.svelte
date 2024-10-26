<script lang="ts">
	import { STICKER_POPOVER_ID } from '@/constants';
	import { initializePicker } from '../utils';
	import { themeStore } from '@/stores';
	import { TFileData } from '@/io';

	export let close: () => void;
	export let fileData: TFileData;
	// export let

	let pickerContainerEl: HTMLDivElement | null = null;
	let pickerInitialized = false;
	$: {
		const theme = $themeStore;
		pickerContainerEl && theme && initializePicker(pickerContainerEl, theme, fileData);
		if (!pickerInitialized && pickerContainerEl) {
			pickerInitialized = true;
		}
	}
</script>

<div
	class="bg-transparent z-20 w-max opacity-0 pointer-events-none absolute top-0 left-0"
	data-popover={true}
	id={STICKER_POPOVER_ID}
	bind:this={pickerContainerEl}
/>

<style lang="postcss">
	/* @tailwind base; */
	@tailwind components;
	@tailwind utilities;

	#emoji-modal {
		padding: 0px;
		min-width: unset;
		width: unset !important;
	}
</style>

