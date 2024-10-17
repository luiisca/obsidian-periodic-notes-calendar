<script lang="ts">
	import { onMount } from 'svelte';
	import type { ConfirmationModal, IConfirmationDialogParams } from '../modals/confirmation';

	export let config: IConfirmationDialogParams;
	export let modalClass: ConfirmationModal;

	const { title, text, note, cta, onAccept } = config;

	let dontAskAgain = false;
	let noteHtmlEl: HTMLElement;

	const handleCancel = async () => {
		modalClass.close();
	};

	const handleAccept = async () => {
		modalClass.close();

		await onAccept(dontAskAgain);
	};

	onMount(() => {
		if (noteHtmlEl) {
			noteHtmlEl.innerHTML = note || '';
		}
	});
</script>

<div>
	<h2>{title}</h2>
	<p>{text}</p>
	<label class="flex items-center hover:cursor-pointer text-sm mt-7">
		<input type="checkbox" class="hover:cursor-pointer" bind:checked={dontAskAgain} /> Don't ask again
	</label>
	{#if note}
		<p class="m-0 mt-2 text-xs text-[--text-muted]" bind:this={noteHtmlEl} />
	{/if}
	<div class="modal-button-container mt-3">
		<button on:click={handleCancel}>Never mind</button>
		<button class="mod-cta" on:click={handleAccept}>{cta}</button>
	</div>
</div>

<style lang="postcss">
	@tailwind components;
	@tailwind utilities;
</style>
