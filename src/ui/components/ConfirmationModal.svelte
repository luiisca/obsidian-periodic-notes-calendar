<script lang="ts">
	import { onMount } from 'svelte';
	import type { ConfirmationModal, IConfirmationDialogParams } from '../modals/confirmation';

	export let config: IConfirmationDialogParams;
	export let modalClass: ConfirmationModal;

	const { title, text, note, cta, onAccept } = config;

	let dontAskAgain = false;
	let titleContainer: HTMLElement;
	let textContainer: HTMLElement;
	let noteContainer: HTMLElement;

	const handleCancel = async () => {
		modalClass.close();
	};

	const handleAccept = async () => {
		modalClass.close();

		await onAccept(dontAskAgain);
	};

	onMount(() => {
		// Handle title content
		if (titleContainer) {
			if (typeof title === 'string') {
				titleContainer.textContent = title;
			} else if (title) {
				new title.Component({
					target: titleContainer,
					props: title.props
				});
			}
		}

		// Handle text content
		if (textContainer) {
			if (typeof text === 'string') {
				textContainer.textContent = text;
			} else if (text) {
				new text.Component({
					target: textContainer,
					props: text.props
				});
			}
		}

		// Handle note content
		if (noteContainer && note) {
			if (typeof note === 'string') {
				noteContainer.textContent = note;
			} else if (note) {
				new note.Component({
					target: noteContainer,
					props: note.props
				});
			}
		}
	});
</script>

<div>
	<h2 bind:this={titleContainer} />
	<p bind:this={textContainer} />
	<label class="flex items-center hover:cursor-pointer text-sm mt-7">
		<input type="checkbox" class="hover:cursor-pointer" bind:checked={dontAskAgain} /> Don't ask again
	</label>
	{#if note}
		<p class="m-0 mt-2 text-xs text-[--text-muted]" bind:this={noteContainer} />
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
