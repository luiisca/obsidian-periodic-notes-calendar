import { computePosition, autoUpdate, flip, offset, shift, arrow } from '@floating-ui/dom';
import View from './View.svelte';
import { get, writable } from 'svelte/store';
import type DailyNoteFlexPlugin from './main';
import { settingsStore } from './stores';

const DEFAULT_STATE = {
	opened: false,
	referenceEl: null,
	floatingEl: null,
	cleanupPopupAutoUpdate: () => ({})
} as const;
export const popoverstore = writable<{
	opened: boolean;
	referenceEl: HTMLElement | null;
	floatingEl: HTMLElement | null;
	cleanupPopupAutoUpdate: () => void;
}>(DEFAULT_STATE);

const positionFloatingEl = ({
	referenceEl,
	floatingEl
}: {
	referenceEl: HTMLElement;
	floatingEl: HTMLElement;
}) => {
	const arrowEl = document.createElement('div') as HTMLElement;

	computePosition(referenceEl, floatingEl, {
		placement: 'right',
		middleware: [offset(16), shift({ padding: 8 }), flip(), arrow({ element: arrowEl })]
	}).then(({ x, y, placement, middlewareData }) => {
		Object.assign(floatingEl.style, {
			left: `${x}px`,
			top: `${y}px`
		});
		// Handle Arrow Placement:
		// https://floating-ui.com/docs/arrow
		if (arrowEl && middlewareData.arrow) {
			const { x: arrowX, y: arrowY } = middlewareData.arrow;

			const staticSide = {
				top: 'bottom',
				right: 'left',
				bottom: 'top',
				left: 'right'
			}[placement.split('-')[0]];

			staticSide &&
				Object.assign(arrowEl.style, {
					left: arrowX != null ? `${arrowX}px` : '',
					top: arrowY != null ? `${arrowY}px` : '',
					right: '',
					bottom: '',
					[staticSide]: '-4px'
				});
		}
	});
};
const revealFloatingEl = ({ floatingEl }: { floatingEl: HTMLElement }) => {
	floatingEl.style.display = 'block';
	floatingEl.style.opacity = '1';
	floatingEl.style.pointerEvents = 'auto';
};
const hideFloatingEl = ({ floatingEl }: { floatingEl: HTMLElement }) => {
	floatingEl.style.opacity = '0';
};
const setFloatingElInteractivity = ({
	enabled,
	floatingEl
}: {
	enabled: boolean;
	floatingEl: HTMLElement;
}) => {
	if (enabled) {
		floatingEl.removeAttribute('inert');
	} else {
		floatingEl.setAttribute('inert', '');
	}
};

const getReferenceEl = () =>
	document.querySelector(`[id="daily-note-flex-plugin-ribbon"]`) as HTMLElement;
const getFloatingEl = () => document.querySelector('[data-popup="true"]') as HTMLElement;

const openPopover = () => {
	const { referenceEl, floatingEl } = get(popoverstore);

	if (referenceEl && floatingEl) {
		positionFloatingEl({ referenceEl, floatingEl });
		revealFloatingEl({ floatingEl });
		setFloatingElInteractivity({ floatingEl, enabled: true });

		popoverstore.update((values) => ({
			...values,
			opened: true,
			// Trigger Floating UI autoUpdate (open only)
			// https://floating-ui.com/docs/autoUpdate
			cleanupPopupAutoUpdate: autoUpdate(referenceEl, floatingEl, () =>
				positionFloatingEl({ referenceEl, floatingEl })
			)
		}));
	}
};
export const closePopover = () => {
	const { referenceEl, floatingEl, cleanupPopupAutoUpdate } = get(popoverstore);

	if (referenceEl && floatingEl) {
		hideFloatingEl({ floatingEl });
		setFloatingElInteractivity({ floatingEl, enabled: false });
		cleanupPopupAutoUpdate();

		popoverstore.update((values) => ({
			...values,
			opened: false
		}));
	}
};
export const togglePopover = () => {
	const { opened } = get(popoverstore);
	const { openPopupOnRibbonHover } = get(settingsStore);

	if (!opened) {
		openPopover();

		if (openPopupOnRibbonHover) {
			window.addEventListener('mouseover', onWindowEvent);
		} else {
			window.addEventListener('click', onWindowEvent);
		}
		window.addEventListener('keydown', onWindowKeyDown);
	} else {
		closePopover();

		window.removeEventListener('mouseover', onWindowEvent);
		window.removeEventListener('click', onWindowEvent);
		window.removeEventListener('keydown', onWindowKeyDown);
	}
};

// event listeners
const onRibbonHover = () => {
	const { opened } = get(popoverstore);

	if (!opened) {
		openPopover();

		window.addEventListener('mouseover', onWindowEvent);
		window.addEventListener('keydown', onWindowKeyDown);
	}
};

const onWindowEvent = (event: MouseEvent) => {
	const { referenceEl, floatingEl } = get(popoverstore);

	if (referenceEl && floatingEl) {
		const ev = event as MouseEvent & { target: Node | null };
		const referenceElTouched = referenceEl.contains(ev.target);
		const floatingElTouched = floatingEl.contains(ev.target);

		if (referenceElTouched) return;

		if (!floatingElTouched) {
			togglePopover();

			return;
		}
	}
};

// Accessibility Keyboard Interactions
const onWindowKeyDown = (event: KeyboardEvent) => {
	event.preventDefault();
	const { referenceEl, floatingEl, opened } = get(popoverstore);

	if (referenceEl && floatingEl) {
		const focusableAllowedList =
			':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';

		const focusablePopupElements: HTMLElement[] = Array.from(
			floatingEl?.querySelectorAll(focusableAllowedList)
		);

		const referenceElFocused: boolean = opened && document.activeElement === referenceEl;
		// When the user focuses on 'referenceEl' and then presses the Tab or ArrowDown key, the first element inside the view should receive focus.
		if (
			referenceElFocused &&
			(event.key === 'ArrowDown' || event.key === 'Tab') &&
			focusablePopupElements.length > 0
		) {
			focusablePopupElements[0].focus();

			return;
		}

		if (event.key === 'Escape') {
			referenceEl.focus();
			togglePopover();

			return;
		}
	}
};

const setupView = ({ plugin }: { plugin: DailyNoteFlexPlugin }) => {
	if (!plugin.popupCalendar) {
		new View({
			target: document.body,
			props: { popup: true }
		});

		popoverstore.update((values) => ({
			...values,
			referenceEl: getReferenceEl(),
			floatingEl: getFloatingEl()
		}));
	}
};
// define both onRibbonClicked and onRibbonHovered fns
export const togglePopupOnClick = ({ plugin }: { plugin: DailyNoteFlexPlugin }) => {
	setupView({ plugin });
	togglePopover();

	const cleanupPopup = () => {
		popoverstore.update((values) => ({
			...values,
			opened: false,
			referenceEl: null,
			floatingEl: null,
			cleanupPopupAutoUpdate: () => ({})
		}));

		window.removeEventListener('click', onWindowEvent);

		plugin.popupCalendar && plugin.popupCalendar.$destroy();
	};
	return cleanupPopup;
};

export const registerTogglePopupOnHover = ({ plugin }: { plugin: DailyNoteFlexPlugin }) => {
	setupView({ plugin });
	const { referenceEl } = get(popoverstore);

	if (referenceEl) {
		referenceEl.addEventListener('mouseover', onRibbonHover);
	}

	const cleanupPopup = () => {
		popoverstore.update((values) => ({
			...values,
			opened: false,
			referenceEl: null,
			floatingEl: null,
			cleanupPopupAutoUpdate: () => ({})
		}));

		referenceEl && referenceEl.removeEventListener('mouseover', onRibbonHover);
		window.removeEventListener('mouseover', onWindowEvent);
		window.removeEventListener('keydown', onWindowKeyDown);

		plugin.popupCalendar && plugin.popupCalendar.$destroy();
	};
	return cleanupPopup;
};
