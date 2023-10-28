<script lang="ts">
	import { onMount } from 'svelte';
	import type { StickerModal } from '../modals/sticker-picker';
	import { Notice } from 'obsidian';
	import { pluginClassStore, type TNotesStore } from '@/stores';
	import { get, type Writable } from 'svelte/store';
	import { STICKER_TAG_PREFIX } from '@/constants';

	export let modalClass: StickerModal;
	export let noteStore: Writable<TNotesStore>;
	export let noteDateUID: string;

	let loading: boolean = false;
	let loaded: boolean = false;
	let error: string | null = null;

	let pickerContainerEl: HTMLDivElement;

	const onLoadPicker = () => {
		try {
			console.log('script loaded! > Picker loaded ✅');
			const theme = $pluginClassStore.app.getTheme() === 'moonstone' ? 'light' : 'dark';
			const pickerOptions = {
				onEmojiSelect: (emoji: string) => {
					console.log('EMOJI SELECTED: ', emoji);
					modalClass.close();

					// update store note with new emoji
					noteStore.update((values) => ({
						...values,
						[noteDateUID]: {
							file: values[noteDateUID].file,
							sticker: emoji.native
						}
					}));

					// add new tag to file
					const file = get(noteStore)[noteDateUID].file;
					window.app.vault.process(file, (data) => {
						const newTag = `${STICKER_TAG_PREFIX}${emoji.native}`;
						const prevStickerTag = data.match(/#sticker-[^\s]+/);

						console.log('ABOUT to replace previous tags: ', prevStickerTag, data);
						if (prevStickerTag) {
							let firstMatched: boolean = false;

							return data
								.replace(/#sticker-[^\s]+/g, () => {
									if (!firstMatched) {
										firstMatched = true;

										return newTag;
									}
									return '';
								})
								.replace(/\s+/g, ' ');
						} else {
							return `${newTag} ${data}`;
						}

						return data;
					});
				},
				autoFocus: true,
				theme
			};
			const emojiMartEl = new EmojiMart.Picker(pickerOptions);
			// add custom styles
			const sheet = new CSSStyleSheet();
			sheet.replaceSync('section#root {font-family: inherit');
			emojiMartEl.shadowRoot?.adoptedStyleSheets.push(sheet);

			if (!loaded) {
				// hide picker until is fully visible
				emojiMartEl.style.display = 'none';
				pickerContainerEl.appendChild(emojiMartEl);

				const interval = setInterval(() => {
					if (emojiMartEl?.shadowRoot?.querySelector('section')) {
						clearInterval(interval);

						// show picker again once it is fully loaded
						emojiMartEl.style.display = 'flex';
						loading = false;
						loaded = true;
					}
				}, 50);
			} else {
				// picker script already loaded so display it directly
				pickerContainerEl.appendChild(emojiMartEl);
			}
		} catch (error) {
			onErrorPicker({ err: error });
		}
	};
	const onErrorPicker = ({ err }: { err?: Error } = {}) => {
		// TODO: improve wording
		loading = false;
		error = `Failed to load picker. Check your connection or reload the app. ${err && `(${err})`}`;
	};

	const loadPickerWithRetry = (retries: number = 0) => {
		console.log('Loadig picker 🔃');
		try {
			if (
				document.querySelector(
					'script[src="https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js"]'
				)
			) {
				loaded = true;
				onLoadPicker();

				return;
			}

			loading = true;
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js';
			document.body.appendChild(script);

			script.onload = onLoadPicker;

			script.onerror = () => {
				if (retries < 3) {
					new Notice('Retrying to load picker');
					loadPickerWithRetry(retries + 1);
				} else {
					onErrorPicker();
				}
			};
		} catch (error) {
			onErrorPicker({ err: error });
		}
	};

	onMount(() => {
		loadPickerWithRetry();
	});
</script>

<div bind:this={pickerContainerEl}>
	{#if loading}
		<p class="w-96">Loading picker...</p>
	{/if}
	{#if error}
		<p>{error}</p>
	{/if}
</div>

<style>
	/* @tailwind base; */
	@tailwind components;
	@tailwind utilities;

	#emoji-modal {
		padding: 0px;
		min-width: unset;
		width: unset !important;
	}
</style>
