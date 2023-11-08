<script lang="ts">
	import { onMount } from 'svelte';
	import type { StickerModal } from '../modals/sticker-picker';
	import { pluginClassStore, settingsStore, type TNotesStore } from '@/stores';
	import { get, type Writable } from 'svelte/store';
	import { CALENDAR_POPOVER_ID, EMOJI_POPOVER_ID, STICKER_TAG_PREFIX } from '@/constants';
	import clsx from 'clsx';
	import pickerData from '@emoji-mart/data';
	import { Picker } from 'emoji-mart';
	import { popoversStore } from '@/popover';

	export let close: () => void;
	export let noteStore: Writable<TNotesStore>;
	export let noteDateUID: string;
	export let popover: boolean = false;

	let pickerContainerEl: HTMLDivElement | null = null;

	const theme = $pluginClassStore.app.getTheme() === 'moonstone' ? 'light' : 'dark';

	const pickerOptions = {
		data: pickerData,
		onEmojiSelect: (emoji: string) => {
			console.log('EMOJI SELECTED: ', emoji);

			close();
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
			});
		},
		autoFocus: true,
		theme
	};

	const emojiMartEl = new Picker(pickerOptions) as unknown as Node;
	// add custom styles
	const sheet = new CSSStyleSheet();
	sheet.replaceSync('section#root {font-family: inherit');
	emojiMartEl.shadowRoot?.adoptedStyleSheets.push(sheet);

	$: pickerContainerEl?.appendChild(emojiMartEl);
</script>

<div
	class={clsx(
		popover &&
			'bg-red-400 z-20 w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300'
	)}
	data-popover={popover}
	id={EMOJI_POPOVER_ID}
>
	<div id={`${EMOJI_POPOVER_ID}-arrow`} class="rotate-45 absolute w-2.5 h-2.5 bg-slate-500" />

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
