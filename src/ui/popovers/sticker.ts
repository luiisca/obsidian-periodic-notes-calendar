import { STICKER_POPOVER_ID } from '@/constants';
import { settingsStore } from '@/settings';
import { ComponentType } from 'svelte';
import { get } from 'svelte/store';
import { TWindowEvents } from '../types';
import { BaseComponentBehavior } from './base-component-behavior';
import { getPopoverInstance, Popover } from './base';

// export const spInputKeydownHandlerStore = writable((ev: KeyboardEvent) => {
//     const spInput = document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');
//     const settings = get(settingsStore);
//
//     if (ev.key === 'Escape') {
//         if (settings.popoversClosing.closePopoversOneByOneOnEscKeydown) {
//             spInput && spInput.blur();
//             if (settings.popoversClosing.closeOnEscStickerSearchInput) {
//                 closePopover({ id });
//             }
//
//             return
//         } else {
//             // close all popovers
//             Popover.instances.forEach((instance) => instance?.close());
//         }
//     }
// });


export type TStickerPopoverParams = {
    id: typeof STICKER_POPOVER_ID,
    view: {
        Component: ComponentType;
        props?: Record<string, unknown>;
    },
    refHtmlEl: HTMLElement,
}

export class StickerPopoverBehavior extends BaseComponentBehavior {
    constructor(private params: TStickerPopoverParams) {
        super(params.id, params.view, params.refHtmlEl)
    }

    public open() {
        super.open();

        this.getSearchInput()?.focus();
        // TODO: is it neccessary? or would window event listener be enough
        // // ensure event is fired in the capturing phase
        // searchInput?.addEventListener('keydown', get(spInputKeydownHandlerStore), true);

        this.addWindowListeners(this.getWindowEvents());
    }

    public close() {
        super.close();

        this.getSearchInput()?.blur();
        // TODO: solve this.open's TODO first
        // spInput?.removeEventListener('keydown', get(spInputKeydownHandlerStore), true);

        this.removeWindowListeners(this.getWindowEvents());
    }
    public cleanup() {
        this.close();
        this.component.$destroy();
    }

    private getWindowEvents(): TWindowEvents {
        return {
            click: this.handleWindowClick,
            auxclick: this.handleWindowClick,
            keydown: this.handleWindowKeydown
        }
    }
    public handleWindowClick(event: MouseEvent) {
        const ev = event as MouseEvent & { target: HTMLElement | null };

        const menuEl = document.querySelector('.menu');

        const stickerElTouched =
            this.componentHtmlEl.contains(ev.target) ||
            ev.target?.id.includes(STICKER_POPOVER_ID);
        const menuElTouched = menuEl?.contains(ev.target) || ev.target?.className.includes('menu');

        // close SP if user clicks anywhere but SP
        // && !menuElTouched is only relevant for first call
        if (getPopoverInstance(this.params.id)?.opened && !stickerElTouched && !menuElTouched) {
            this.close();

            return;
        }
    };

    public handleWindowKeydown(event: KeyboardEvent) {
        const settings = get(settingsStore);

        const focusableSelectors =
            ':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';

        const focusablePopoverElements: HTMLElement[] = Array.from(
            this.componentHtmlEl.querySelectorAll(focusableSelectors)
        );

        const referenceElFocused: boolean =
            (getPopoverInstance(this.params.id)?.opened && document.activeElement === this.refHtmlEl) || false;
        // When the user focuses on 'referenceEl' and then presses the Tab or ArrowDown key, the first element inside the view should receive focus.
        // TODO: make it work!
        if (
            referenceElFocused &&
            (event.key === 'ArrowDown' || event.key === 'Tab') &&
            focusablePopoverElements.length > 0
        ) {
            focusablePopoverElements[0].focus();

            return;
        }

        if (event.key === 'Escape') {
            const searchInput = document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');

            if (
                searchInput &&
                searchInput.isActiveElement()
            ) {
                searchInput.blur();
                if (settings.popoversClosing.closeOnEscStickerSearchInput) {
                    this.close();
                }

                return
            }

            if (settings.popoversClosing.closePopoversOneByOneOnEscKeydown) {
                this.close();
            } else {
                Popover.instances.forEach((instance) => instance?.close());
            }
            this.refHtmlEl.focus();

            return;
        }
    };

    private getSearchInput() {
        return document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');
    }
}
