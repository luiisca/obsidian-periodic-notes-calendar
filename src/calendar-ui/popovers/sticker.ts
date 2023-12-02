import { CALENDAR_POPOVER_ID, STICKER_POPOVER_ID } from '@/constants';
import {
	closePopover,
	getFloatingEl,
	popoversStore,
	positionFloatingEl,
	revealFloatingEl,
	setFloatingElInteractivity,
	type IPopoverUtils,
	type TPopovers,
	type TWindowEvents
} from '.';
import { get, writable } from 'svelte/store';
import type DailyNoteFlexPlugin from '@/main';
import { autoUpdate } from '@floating-ui/dom';
import { settingsStore } from '@/stores/';

const id: TPopovers = STICKER_POPOVER_ID;
export const spInputKeydownHandlerStore = writable((ev: KeyboardEvent) => {
	const spInput = document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');
	const settings = get(settingsStore);
	const searchInputOnEscKeydown = settings.popoversCloseData.searchInputOnEscKeydown;

	if (ev.key === 'Escape') {
		if (settings.popoversCloseData.closePopoversOneByOneOnEscKeydown) {
			if (searchInputOnEscKeydown === 'close-popover') {
				closePopover({ id });

				return;
			}

			if (spInput && searchInputOnEscKeydown === 'reset') {
				if (spInput.value.trim().length > 0) {
					// reset input
					spInput.value = '';
				} else {
					closePopover({ id });
				}
			}
		} else {
			// close all popover from capturing-phase-added search input event handler as it stops propagation and window event handlers will not be triggered
			closePopover({ id });
			closePopover({ id: CALENDAR_POPOVER_ID });
		}
	}
});

const handleWindowClick = (event: MouseEvent) => {
	const ev = event as MouseEvent & { target: HTMLElement | null };

	const stickerPopoverStore = get(popoversStore)[STICKER_POPOVER_ID];
	const menuEl = document.querySelector('.menu');

	const stickerElTouched =
		stickerPopoverStore?.floatingEl?.contains(ev.target) ||
		ev.target?.id.includes(STICKER_POPOVER_ID);
	const menuElTouched = menuEl?.contains(ev.target) || ev.target?.className.includes('menu');

	// close SP if user clicks anywhere but SP
	// && !menuElTouched is only relevant for first call
	if (stickerPopoverStore?.opened && !stickerElTouched && !menuElTouched) {
		closePopover({ id });

		return;
	}
};

// Accessibility Keyboard Interactions
const handleWindowKeydown = (event: KeyboardEvent) => {
	const settings = get(settingsStore);
	const stickerPopoverStore = get(popoversStore)[id];
	const floatingEl = getFloatingEl({ id });

	const focusableAllowedList =
		':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';

	const focusablePopoverElements: HTMLElement[] = Array.from(
		floatingEl?.querySelectorAll(focusableAllowedList)
	);

	const referenceElFocused: boolean =
		(stickerPopoverStore?.opened && document.activeElement === stickerPopoverStore?.referenceEl) ||
		false;
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
		const spInput = document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');

		if (
			spInput &&
			spInput.isActiveElement() &&
			settings.popoversCloseData.searchInputOnEscKeydown
		) {
			if (settings.popoversCloseData.searchInputOnEscKeydown === 'close-popover') {
				spInput.blur();
				closePopover({ id });

				return;
			}

			if (settings.popoversCloseData.searchInputOnEscKeydown === 'reset') {
				spInput.value = '';

				return;
			}
		}

		stickerPopoverStore?.referenceEl?.focus();
		closePopover({ id });

		return;
	}
};

const windowEvents: TWindowEvents = {
	click: handleWindowClick,
	auxclick: handleWindowClick,
	keydown: handleWindowKeydown
};

export const open = ({ customX, customY }: { customX?: number; customY?: number }) => {
	const floatingEl = getFloatingEl({ id });

	revealFloatingEl({ floatingEl });
	setFloatingElInteractivity({ floatingEl, enabled: true });

	const spInput = document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');
	spInput?.focus();
	// ensure event is fired in the capturing phase
	spInput?.addEventListener('keydown', get(spInputKeydownHandlerStore), true);

	popoversStore.update((values) => ({
		...values,
		[id]: {
			...values[id],
			opened: true,
			floatingEl,
			// Trigger Floating UI autoUpdate (open only)
			// https://floating-ui.com/docs/autoUpdate
			cleanupPopoverAutoUpdate: autoUpdate(values[id]?.referenceEl as HTMLElement, floatingEl, () =>
				positionFloatingEl({
					referenceEl: values[id]?.referenceEl as HTMLElement,
					id,
					customX,
					customY
				})
			)
		}
	}));
};
const close = () => {
	// remove spInput keydown event handler
	const spInput = document.querySelector('em-emoji-picker')?.shadowRoot?.querySelector('input');

	spInput?.blur();
	spInput?.removeEventListener('keydown', get(spInputKeydownHandlerStore), true);
};
export const extraSetup = () => {
	const stickerPopoverStore = get(popoversStore)[id];
	positionFloatingEl({ referenceEl: stickerPopoverStore?.referenceEl as HTMLElement, id });
};
export const cleanup = () => {
	const plugin = get(pluginClassStore);

	popoversStore.update((values) => ({
		...values,
		[id]: {
			opened: false,
			referenceEl: null,
			floatingEl: null,
			cleanupPopoverAutoUpdate: () => ({})
		}
	}));

	if (plugin.popovers) {
		Object.values(plugin.popovers).forEach((popover) => popover?.$destroy());
		plugin.popovers = {};
	}
};

const popover: IPopoverUtils = {
	open,
	close,
	extraSetup,
	cleanup,
	addWindowEvents: () => {
		for (const [evName, cb] of Object.entries(windowEvents)) {
			window.addEventListener(evName, cb);
		}
	},
	removeWindowEvents: () => {
		for (const [evName, cb] of Object.entries(windowEvents)) {
			window.removeEventListener(evName, cb);
		}
	}
};
export { popover };
