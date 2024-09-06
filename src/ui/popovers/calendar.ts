import { CALENDAR_POPOVER_ID, STICKER_POPOVER_ID } from '@/constants';
import {
	closePopover,
	getFloatingEl,
	openPopover,
	popoversStore,
	positionFloatingEl,
	revealFloatingEl,
	setFloatingElInteractivity,
	type IPopoverUtils,
	type TPopovers,
	type TWindowEvents
} from '.';
import { get } from 'svelte/store';
import { crrFileMenu, pluginClassStore, settingsStore } from '@/stores';
import { autoUpdate } from '@floating-ui/dom';

const id: TPopovers = CALENDAR_POPOVER_ID;
export const ribbonReferenceElId = `${id}-ribbon-ref-el`;

const getReferenceEl = () => document.querySelector(`[id=${ribbonReferenceElId}]`) as HTMLElement;

const handleReferenceElHover = () => {
	console.log('🖱️🖱️🖱️handleReferenceElHover()!!! 🤯🤯🤯');
	const calendarPopoverStore = get(popoversStore)[id];

	if (!calendarPopoverStore?.opened) {
		openPopover({ id });
	}
};

const handleWindowMouseover = (event: MouseEvent) => {
	if (get(settingsStore).openPopoverOnRibbonHover) {
		const ev = event as MouseEvent & { target: HTMLElement | null };

		const calendarPopoverStore = get(popoversStore)[id];
		const stickerPopoverStore = get(popoversStore)[STICKER_POPOVER_ID];
		const menuEl = document.querySelector('.menu');

		const calendarElTouched =
			calendarPopoverStore?.floatingEl?.contains(ev.target) ||
			ev.target?.id.includes(CALENDAR_POPOVER_ID);
		const stickerElTouched =
			stickerPopoverStore?.floatingEl?.contains(ev.target) ||
			ev.target?.id.includes(STICKER_POPOVER_ID);
		const menuElTouched = menuEl?.contains(ev.target) || ev.target?.className.includes('menu');
		const referenceElTouched = calendarPopoverStore?.referenceEl?.contains(event.target as Node);

		const targetOut = !calendarElTouched && !menuElTouched && !stickerElTouched;
		const fileMenu = get(crrFileMenu);

		if (referenceElTouched) return;

		// close CP if only CP opened and user hovered anywhere but it
		if (calendarPopoverStore?.opened && !stickerPopoverStore?.opened && !menuEl && targetOut) {
			closePopover({ id: CALENDAR_POPOVER_ID });

			// close crr open ctx menu
			fileMenu?.close();
		}
	}
};
const handleWindowClick = (event: MouseEvent) => {
	const ev = event as MouseEvent & { target: HTMLElement | null };

	const settings = get(settingsStore);
	const calendarPopoverStore = get(popoversStore)[id];
	const stickerPopoverStore = get(popoversStore)[STICKER_POPOVER_ID];
	const menuEl = document.querySelector('.menu');

	const calendarElTouched =
		calendarPopoverStore?.floatingEl?.contains(ev.target) ||
		ev.target?.id.includes(CALENDAR_POPOVER_ID);
	const stickerElTouched =
		stickerPopoverStore?.floatingEl?.contains(ev.target) ||
		ev.target?.id.includes(STICKER_POPOVER_ID);
	const menuElTouched = menuEl?.contains(ev.target) || ev.target?.className.includes('menu');

	const targetOut = !calendarElTouched && !menuElTouched && !stickerElTouched;

	// ensures popovers could be closed one by one
	if (
		calendarPopoverStore?.opened &&
		stickerPopoverStore?.opened &&
		settings.popoversCloseData.closePopoversOneByOneOnClickOut
	) {
		return;
	}

	// close CP if user clicked anywhere but either CP, context menu or SP
	if (targetOut) {
		closePopover({ id: CALENDAR_POPOVER_ID });
	}
};

// Accessibility Keyboard Interactions
const handleWindowKeydown = (event: KeyboardEvent) => {
	const settings = get(settingsStore);
	const calendarPopoverStore = get(popoversStore)[id];
	const stickerPopoverStore = get(popoversStore)[STICKER_POPOVER_ID];
	const floatingEl = getFloatingEl({ id });
	const referenceEl = getReferenceEl();

	const focusableAllowedList =
		':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';

	const focusablePopoverElements: HTMLElement[] = Array.from(
		floatingEl?.querySelectorAll(focusableAllowedList)
	);

	const referenceElFocused: boolean =
		(calendarPopoverStore?.opened && document.activeElement === referenceEl) || false;
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

	// ensures popovers could be closed one by one
	if (
		calendarPopoverStore?.opened &&
		stickerPopoverStore?.opened &&
		settings.popoversCloseData.closePopoversOneByOneOnEscKeydown
	) {
		return;
	}

	if (event.key === 'Escape') {
		referenceEl?.focus();
		closePopover({ id });

		return;
	}
};
const windowEvents: TWindowEvents = {
	click: handleWindowClick,
	auxclick: handleWindowClick,
	keydown: handleWindowKeydown,
	mouseover: handleWindowMouseover
};

export const open = () => {
	const floatingEl = getFloatingEl({ id });
	const referenceEl = getReferenceEl();

	revealFloatingEl({ floatingEl });
	setFloatingElInteractivity({ floatingEl, enabled: true });

	popoversStore.update((values) => ({
		...values,
		[id]: {
			...values[id],
			opened: true,
			floatingEl,
			referenceEl,
			// Trigger Floating UI autoUpdate (open only)
			// https://floating-ui.com/docs/autoUpdate
			cleanupPopoverAutoUpdate: autoUpdate(referenceEl, floatingEl, () =>
				positionFloatingEl({ referenceEl, id })
			)
		}
	}));
};
export const extraSetup = () => {
	console.log('🤯🤯calendar popover extraSetup()!!');
	positionFloatingEl({ referenceEl: getReferenceEl(), id });

	if (get(settingsStore).openPopoverOnRibbonHover) {
		getReferenceEl().addEventListener('mouseover', handleReferenceElHover);
	}
};
export const cleanup = () => {
	console.log('🧹🤯📅📅📅Calendar popover cleanup()');
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

	getReferenceEl().removeEventListener('mouseover', handleReferenceElHover);
	popover.removeWindowEvents();

	if (plugin.popovers) {
		Object.values(plugin.popovers).forEach((popover) => popover?.$destroy());
		plugin.popovers = {};
	}
};

const popover: IPopoverUtils = {
	open,
	extraSetup,
	cleanup,
	windowEvents,
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
