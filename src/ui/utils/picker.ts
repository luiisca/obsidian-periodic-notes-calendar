import { Picker } from "emoji-mart";
import pickerData from '@emoji-mart/data';
import { notesStores, TStickerComponentProps } from "@/stores";
import PeriodicNotesCalendarPlugin from "@/main";
import { getDateUID } from "@/io";
import { get } from "svelte/store";
import { STICKER_TAG_PREFIX } from "@/constants";

type TEmoji = {
    aliases?: string[],
    id: string,
    keywords: string[],
    name: string,
    native: string,
    shortcodes: string,
    skin?: number,
    unified: string,
}
export function initializePicker(
    container: HTMLElement | null,
    stickerComponentProps: TStickerComponentProps,
    pluginClass: PeriodicNotesCalendarPlugin,
) {
    const { note, date, granularity } = stickerComponentProps
    const noteStore = granularity !== null ? notesStores[granularity] : null;
    const noteDateUID = date !== null && granularity != null ? getDateUID({ date, granularity }) : null;
    const theme = (pluginClass.getTheme() as unknown as string) === 'moonstone' ? 'light' : 'dark';

    const pickerOptions = {
        // TODO: test pickerData offline
        onEmojiSelect: (emoji: TEmoji) => {
            close();
            if (noteStore && noteDateUID) {
                console.log('💔<StickerPopover /> onEmojiSelect > noteStore: ', noteStore);
                // update store with new emoji
                noteStore.update((values) => ({
                    ...values,
                    [noteDateUID]: {
                        file: values[noteDateUID].file,
                        sticker: emoji.native
                    }
                }));

                // update note with new emoji tag
                const file = get(noteStore)[noteDateUID].file;
                window.app.vault.process(file, (data) => {
                    // TODO: simplify match with EmojiMart.getEmojiDataFromNative check
                    // to allow user to add a new emoji by just doing: #✅
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
            }
        },
        autoFocus: true,
        theme,
    };

    const pickerEl = new Picker(pickerOptions);
    // add custom styles
    pickerEl.injectStyles(`
      section#root {
        font-family: inherit;
        background-color: pink;
      }
    `);

    if (container) {
        const pickerHtmlEl = pickerEl as unknown as HTMLElement
        container.appendChild(pickerHtmlEl);

        handleMutationObserver(pickerHtmlEl.shadowRoot);
    }
}

function handleMutationObserver(shadowRoot: ShadowRoot | null) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            const input = shadowRoot?.querySelector('input');

            if (input) {
                // input.focus();
                // TODO: may not be needed, since a global keydown handler might take care of bluring focus on escape
                // input.addEventListener('keydown', get(spInputKeydownHandlerStore), true);
                input.addEventListener('keydown', console.log, true);

                // Stop observing once the element is found
                observer.disconnect();
            }
        });
    });

    // Start observing changes in the shadow DOM
    shadowRoot && observer.observe(shadowRoot, { subtree: true, childList: true });
}
