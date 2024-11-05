<script lang="ts">
	import { onMount } from 'svelte';
	import type { ConfirmationModal, IConfirmationDialogParams } from '../modals/confirmation';

	interface Props {
		config: IConfirmationDialogParams;
		modalClass: ConfirmationModal;
	}

	let { config, modalClass }: Props = $props();

	const { title, text, note, cta, onAccept } = config;

	let dontAskAgain = $state(false);
	let titleContainer: HTMLElement = $state();
	let textContainer: HTMLElement = $state();
	let noteContainer: HTMLElement = $state();

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
	<h2 class="!mt-0" bind:this={titleContainer}></h2>
	<p bind:this={textContainer}></p>
	<label class="flex items-center hover:cursor-pointer mt-7">
		<input type="checkbox" class="hover:cursor-pointer" bind:checked={dontAskAgain} /> Don't ask again
	</label>
	{#if note}
		<p
			class="m-0 mt-2 [font-size:var(--font-ui-small)] text-[--text-muted]"
			bind:this={noteContainer}
		></p>
	{/if}
	<div class="modal-button-container mt-3">
		<button onclick={handleCancel}>Never mind</button>
		<button class="mod-cta" onclick={handleAccept}>{cta}</button>
	</div>
</div>

<style lang="postcss">
	@tailwind base;
	@tailwind utilities;
</style>
