import { STICKER_POPOVER_ID } from "@/constants";
import { getNoteDateUID } from "@/io";
import { settingsStore } from "@/settings";
import { notesStores, stickerComponentPropsStore } from "@/stores";
import data from "@emoji-mart/data";
import { Picker } from "emoji-mart";
import { get } from "svelte/store";
import { getBehaviorInstance, getPopoverInstance, Popover } from "../popovers";
import { TagCache } from "obsidian";

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

export const onInputKeydown = (ev: KeyboardEvent) => {
    const input = document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');
    const settings = get(settingsStore);
    const stickerInstance = getPopoverInstance(STICKER_POPOVER_ID);
    const stickerBehaviorInstance = getBehaviorInstance(STICKER_POPOVER_ID);

    if (ev.key === 'Escape') {
        if (settings.popoversClosing.closePopoversOneByOneOnEscKeydown) {
            input && input.blur();
            stickerInstance?.close()
        } else {
            Popover.instances.forEach((instance) => instance?.close());
        }
        stickerBehaviorInstance?.refHtmlEl?.focus();
    }
};

export function initializePicker(
    container: HTMLElement,
    theme: "light" | "dark" | null,
) {
    const pickerOptions = {
        data,
        onEmojiSelect: async (emoji: TEmoji) => {
            const stickerInstance = getPopoverInstance(STICKER_POPOVER_ID);
            stickerInstance?.close()

            const { date, granularity } = get(stickerComponentPropsStore);
            const noteStore = granularity ? notesStores[granularity] : null;
            const noteDateUID = date && granularity ? getNoteDateUID({ date, granularity }) : null;

            if (noteStore && noteDateUID) {
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
                const tags = window.app.metadataCache.getFileCache(file)?.tags;
                const content = await window.app.vault.read(file)
                let updatedContent = content

                const hasEmoji = doTagsIncludeEmoji(tags)
                if (hasEmoji) {
                    const bef = updatedContent.slice(0, hasEmoji.startOffset)
                    const aft = updatedContent.slice(hasEmoji.endOffset)
                    updatedContent = `${bef}#${emoji.native}${aft}`;

                    window.app.vault.modify(file, updatedContent)
                } else {
                    const firstLine = updatedContent.split('\n')[0].trim();
                    window.app.vault.modify(file, `#${emoji.native}${firstLine !== "" ? " \n" : ""}${updatedContent} `)
                }
            };
        },
        autoFocus: true,
        emojiButtonColors: ['color-mix(in srgb, var(--interactive-accent) 20%, transparent)'],
        theme,
    };

    const pickerEl = new Picker(pickerOptions);
    const style = getComputedStyle(document.body)
    var h = parseInt(style.getPropertyValue('--accent-h'));
    var s = parseInt(style.getPropertyValue('--accent-s'));
    var l = parseInt(style.getPropertyValue('--accent-l'));

    const accentRgb = hslToRgb(h / 360, s / 100, l / 100)
    pickerEl.injectStyles(`
        section#root {
            font-family: var(--font-interface);
            font-weight: 400 !important;
            --rgb-accent: ${accentRgb[0]}, ${accentRgb[1]}, ${accentRgb[2]};
            --color-a: var(--interactive-accent-hover);
            --color-b: var(--text-muted);
        }
        .sticky {
            font-weight: 400!important;
        }
    `);

    const pickerHtmlEl = pickerEl as unknown as HTMLElement
    container.firstChild && container.removeChild(container.firstChild);
    container.appendChild(pickerHtmlEl);

    handleMutationObserver(pickerHtmlEl.shadowRoot);
}

function handleMutationObserver(shadowRoot: ShadowRoot | null) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            const input = shadowRoot?.querySelector('input');

            if (input) {
                input.addEventListener('keydown', onInputKeydown, true);

                // Stop observing once the element is found
                observer.disconnect();
            }
        });
    });

    // Start observing changes in the shadow DOM
    shadowRoot && observer.observe(shadowRoot, { subtree: true, childList: true });
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from https://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h: number, s: number, l: number): Array<number> {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hueToRgb(p: number, q: number, t: number) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}

export function doTagsIncludeEmoji(tags?: TagCache[]) {
    if (tags) {
        let hasEmoji: { emoji: string, startOffset: number, endOffset: number } | null = null;
        for (let index = 0; index < tags.length; index++) {
            const tagObj = tags[index];

            if (/\p{RGI_Emoji}/v.test(tagObj.tag)) {
                hasEmoji = {
                    emoji: tagObj.tag.slice(1),
                    startOffset: tagObj.position.start.offset,
                    endOffset: tagObj.position.end.offset,
                }

                break;
            } else {
                continue;
            }
        }

        return hasEmoji
    }
}
