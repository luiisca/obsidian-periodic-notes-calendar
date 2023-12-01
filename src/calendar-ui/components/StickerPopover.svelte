<script lang="ts">
	import { notesStores, pluginClassStore, stickerPopoverCrrGranularity, stickerPopoverNoteDateUIDStore, type TNotesStore } from '@/stores';
	import { get, type Writable } from 'svelte/store';
	import { STICKER_POPOVER_ID, STICKER_TAG_PREFIX } from '@/constants';
	import pickerData from '@emoji-mart/data';
	import { Picker } from 'emoji-mart';
	import { spInputKeydownHandlerStore } from '../popovers/sticker';

	export let close: () => void;
	let noteStore: Writable<TNotesStore>;

	$: $stickerPopoverCrrGranularity, (noteStore = notesStores[$stickerPopoverCrrGranularity]);
	$: noteDateUID = $stickerPopoverNoteDateUIDStore;

	let pickerContainerEl: HTMLDivElement | null = null;

	const theme = $pluginClassStore.app.getTheme() === 'moonstone' ? 'light' : 'dark';

	const pickerOptions = {
		data: pickerData,
		onEmojiSelect: (emoji: string) => {
			close();
			// update store note with new emoji
			console.log('💔<StickerPopover /> onEmojiSelect > noteStore: ', noteStore);
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
			});
		},
		theme
	};

	const emojiMartEl = new Picker(pickerOptions) as unknown as Node;
	// add custom styles
	const sheet = new CSSStyleSheet();
	sheet.replaceSync('section#root {font-family: inherit');
	emojiMartEl.shadowRoot?.adoptedStyleSheets.push(sheet);

	$: if (pickerContainerEl) {
		pickerContainerEl.appendChild(emojiMartEl);

		const shadowRoot = emojiMartEl.shadowRoot;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach(() => {
				const input = shadowRoot.querySelector('input') as HTMLElement;

				if (input) {
					input.focus();
					input.addEventListener('keydown', get(spInputKeydownHandlerStore), true);

					// Stop observing once the element is found
					observer.disconnect();
				}
			});
		});

		// Start observing changes in the shadow DOM
		observer.observe(shadowRoot, { subtree: true, childList: true });
	}
</script>

<div
	class="bg-transparent z-20 w-max opacity-0 pointer-events-none absolute top-0 left-0"
	data-popover={true}
	id={STICKER_POPOVER_ID}
>
	<div bind:this={pickerContainerEl} />
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
