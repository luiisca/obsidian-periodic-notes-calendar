<script lang="ts" generics="T">
	import { pluginClassStore } from '@/stores/';

	import { settingsStore, type ISettings } from '@/settings';

	import type { ConfirmationModal, IConfirmationDialogParams } from '../modals/confirmation';

	export let config: IConfirmationDialogParams<T>;
	export let modalClass: ConfirmationModal<T>;

	const { title, text, note, cta, onAccept } = config;

	let dontConfirmAgain = false;

	const shouldConfirmBeforeCreate = () => {
		if (dontConfirmAgain && $pluginClassStore) {
			settingsStore.update((oldSettings: ISettings) => {
				const newSettings = {
					...oldSettings,
					shouldConfirmBeforeCreate: false
				};

				return newSettings;
			});
		}
	};
	const handleCancel = async () => {
		modalClass.close();
	};

	const handleAccept = async () => {
		modalClass.close();

		await onAccept();
		await shouldConfirmBeforeCreate();
	};
</script>

<div>
	<h2>{title}</h2>
	<p>{text}</p>
	<label class="flex items-center hover:cursor-pointer text-sm mt-7">
		<input type="checkbox" class="hover:cursor-pointer" bind:checked={dontConfirmAgain} /> Don't show
		again
	</label>
	{#if note}
		<p class="m-0 mt-2 text-xs text-[--text-muted]">{note}</p>
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
