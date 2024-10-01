import { CALENDAR_POPOVER_ID, FILE_MENU_POPOVER_ID, STICKER_POPOVER_ID } from '@/constants';
import { settingsStore } from "@/settings";
import { type ComponentType } from 'svelte';
import { get } from 'svelte/store';
import { type TWindowEvents } from '../types';
import { getPopoverInstance } from './base';
import { BaseComponentBehavior } from './base-component-behavior';

function getRefHtmlEl() {
    return document.querySelector(`[id=${CALENDAR_POPOVER_ID}-ribbon-ref-el]`) as HTMLElement | undefined
}

export type TCalendarPopoverParams = {
    id: typeof CALENDAR_POPOVER_ID,
    view: {
        Component: ComponentType;
        props?: Record<string, unknown>;
    }
}

export class CalendarPopoverBehavior extends BaseComponentBehavior {
    public refHtmlEl: HTMLElement | undefined;
    public boundCallbacks = new Map();

    constructor(
        private params: TCalendarPopoverParams,
    ) {
        super(params.id, params.view);
        this.refHtmlEl = getRefHtmlEl();

        if (this.refHtmlEl && get(settingsStore).openPopoverOnRibbonHover) {
            this.refHtmlEl.addEventListener('mouseover', this.handleReferenceElHover);
        }
    }

    public open() {
        this.refHtmlEl = getRefHtmlEl();
        this.refHtmlEl && super.open(this.refHtmlEl);
        this.addWindowListeners(this.getWindowEvents(), this, this.boundCallbacks);
    }

    public close() {
        super.close();
        this.removeWindowListeners(this.getWindowEvents(), this.boundCallbacks);
    }
    public cleanup() {
        this.close();
        this.refHtmlEl?.removeEventListener('mouseover', this.handleReferenceElHover);
        this.component.$destroy();
    }

    private getWindowEvents(): TWindowEvents {
        return {
            click: this.handleWindowClick,
            auxclick: this.handleWindowClick,
            keydown: this.handleWindowKeydown,
            mouseover: this.handleWindowMouseover
        }
    }
    public handleWindowClick(event: MouseEvent) {
        const ev = event as MouseEvent & { target: HTMLElement | null };

        const settings = get(settingsStore);
        const menuEl = document.querySelector('.menu');
        const stickerEl = document.querySelector(`#${STICKER_POPOVER_ID}[data-popover="true"]`) as HTMLElement | undefined;

        const calendarElTouched =
            this.componentHtmlEl.contains(ev.target) ||
            ev.target?.id.includes(CALENDAR_POPOVER_ID);
        const stickerElTouched =
            stickerEl?.contains(ev.target) ||
            ev.target?.id.includes(STICKER_POPOVER_ID);
        const menuElTouched = menuEl?.contains(ev.target) || ev.target?.className.includes('menu');

        const targetOut = !calendarElTouched && !menuElTouched && !stickerElTouched;

        // avoids closing calendar if sticker is open too 
        if (
            getPopoverInstance(this.params.id)?.opened &&
            getPopoverInstance(STICKER_POPOVER_ID)?.opened &&
            settings.popoversClosing.closePopoversOneByOneOnClickOut
        ) {
            return;
        }

        // close calendar popover if user clicked anywhere but either calendar popover, context menu or SP
        if (targetOut) {
            this.close();
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

        // avoids closing calendar if sticker is open too 
        if (
            getPopoverInstance(this.params.id)?.opened &&
            getPopoverInstance(STICKER_POPOVER_ID)?.opened &&
            settings.popoversClosing.closePopoversOneByOneOnEscKeydown
        ) {
            return;
        }

        if (event.key === 'Escape') {
            this.refHtmlEl?.focus();
            this.close();

            return;
        }
    };

    public handleWindowMouseover(event: MouseEvent) {
        if (get(settingsStore).openPopoverOnRibbonHover) {
            const ev = event as MouseEvent & { target: HTMLElement | null };

            const calendarPopover = getPopoverInstance(CALENDAR_POPOVER_ID);
            const stickerPopover = getPopoverInstance(STICKER_POPOVER_ID);
            const fileMenuPopover = getPopoverInstance(FILE_MENU_POPOVER_ID);

            const menuEl = document.querySelector('.menu');
            const stickerEl = document.querySelector(`#${STICKER_POPOVER_ID}[data-popover="true"]`) as HTMLElement | undefined;

            const calendarElTouched =
                this.componentHtmlEl.contains(ev.target) ||
                ev.target?.id.includes(CALENDAR_POPOVER_ID);
            const stickerElTouched =
                stickerEl?.contains(ev.target) ||
                ev.target?.id.includes(STICKER_POPOVER_ID);
            const menuElTouched = menuEl?.contains(ev.target) || ev.target?.className.includes('menu');
            const referenceElTouched = this.refHtmlEl?.contains(event.target as Node);

            const targetOut = !calendarElTouched && !menuElTouched && !stickerElTouched;

            if (referenceElTouched) return;

            const isOnlyCalendarPopoverOpen =
                calendarPopover?.opened && !stickerPopover?.opened && !fileMenuPopover?.opened;

            // close calendar popover if opened and user hovered anywhere but calendar popover
            if (isOnlyCalendarPopoverOpen && targetOut) {
                this.close();
            }
        }
    };
    public handleReferenceElHover() {
        console.log('🖱️🖱️🖱️handleReferenceElHover()!!! 🤯🤯🤯');

        if (!getPopoverInstance(this.params.id)?.opened) {
            this.open();
        }
    }
}
