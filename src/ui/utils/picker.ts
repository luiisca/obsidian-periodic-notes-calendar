import { STICKER_POPOVER_ID } from "@/constants";
import { modifyFile, TFileData, trim } from "@/io";
import { settingsStore } from "@/settings";
import data from "@emoji-mart/data";
import { Picker } from "emoji-mart";
import emojiRegex from "emoji-regex";
import { type TagCache } from "obsidian";
import { get } from "svelte/store";
import { Popover } from "../popovers";
import { PluginService } from "@/app-service";

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
export type TSticker = {
  emoji: string,
  startOffset: number,
  endOffset: number,
}

export const onInputKeydown = (ev: KeyboardEvent) => {
  const input = document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');
  const settings = get(settingsStore);
  const stickerInstance = Popover.stickerSingleton;

  if (ev.key === 'Escape') {
    if (settings.popoversClosing.closePopoversOneByOneOnEscKeydown) {
      if (input) {
        input.blur();
      }
      stickerInstance?.close()
    } else {
      Popover.closeAll()
    }
    stickerInstance?.behaviors?.refHtmlEl?.focus();
  }
};

export function initializePicker(
  container: HTMLElement,
  theme: "light" | "dark" | null,
  fileData: TFileData
) {
  const pickerOptions = {
    data,
    onEmojiSelect: async (emoji: TEmoji) => {
      const stickerInstance = Popover.stickerSingleton;
      stickerInstance?.close()

      const { file, sticker } = fileData;

      if (file) {
        const app = PluginService.getPlugin()?.app
        // update note with new emoji tag
        const content = await PluginService.getPlugin()?.app.vault.read(file) ?? ""
        let updatedContent = content
        const stickerString = `${trim(get(settingsStore).stickerPrefix)}${emoji.native}`

        if (sticker) {
          const bef = updatedContent.slice(0, sticker.startOffset)
          const aft = updatedContent.slice(sticker.endOffset)
          updatedContent = `${bef}#${stickerString}${aft}`;

          await modifyFile(file, updatedContent)
        } else {
          const firstLine = updatedContent.split('\n')[0].trim();
          updatedContent = `#${stickerString}${firstLine !== "" ? " \n" : ""}${updatedContent} `

          await modifyFile(file, updatedContent)
        }
      };
    },
    autoFocus: true,
    emojiButtonColors: ['color-mix(in srgb, var(--interactive-accent) 20%, transparent)'],
    theme,
  };

  const pickerEl = new Picker(pickerOptions);
  const style = getComputedStyle(document.body)
  const h = parseInt(style.getPropertyValue('--accent-h'));
  const s = parseInt(style.getPropertyValue('--accent-s'));
  const l = parseInt(style.getPropertyValue('--accent-l'));

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
  if (container.firstChild) {
    container.removeChild(container.firstChild);
  }
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
  if (shadowRoot) {
    observer.observe(shadowRoot, { subtree: true, childList: true });
  }
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

export function getSticker(tags: TagCache[] | null | undefined): TSticker | null {
  if (!tags) {
    return null
  }

  let sticker: { emoji: string, startOffset: number, endOffset: number } | null = null;
  const prefix = trim(get(settingsStore).stickerPrefix);

  for (const tagObj of tags) {
    // tagObj.tag includes the '#'
    const tagWithoutHash = tagObj.tag.slice(1);
    if (!tagWithoutHash.startsWith(prefix)) {
      continue;
    }

    const emojiCandidate = tagWithoutHash.slice(prefix.length);
    const match = emojiCandidate.match(emojiRegex());

    if (
      match?.[0] === emojiCandidate &&
      match?.[0].length === emojiCandidate.length
    ) {
      sticker = {
        emoji: emojiCandidate,
        startOffset: tagObj.position.start.offset,
        endOffset: tagObj.position.end.offset,
      }

      break;
    } else {
      continue;
    }
  }

  return sticker;
}
