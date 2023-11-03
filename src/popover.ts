import { computePosition, autoUpdate, flip, offset, shift, arrow } from '@floating-ui/dom';
import View from './View.svelte';
import { get, writable } from 'svelte/store';
import type DailyNoteFlexPlugin from './main';
import { settingsStore } from './stores';

const DEFAULT_STATE = {
	opened: false,
	referenceEl: null,
	floatingEl: null,
	cleanupPopoverAutoUpdate: () => ({})
} as const;
export const popoverstore = writable<{
	opened: boolean;
	referenceEl: HTMLElement | null;
	floatingEl: HTMLElement | null;
	cleanupPopoverAutoUpdate: () => void;
}>(DEFAULT_STATE);

const positionFloatingEl = ({
	referenceEl,
	floatingEl
}: {
	referenceEl: HTMLElement;
	floatingEl: HTMLElement;
}) => {
	const arrowEl = document.querySelector('#arrow') as HTMLDivElement;

	console.log('ArrowEl', arrowEl)

	computePosition(referenceEl, floatingEl, {
		placement: 'right',
		middleware: [flip(), arrow({ element: arrowEl })]
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
					[staticSide]: '9px'
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
const getFloatingEl = () => document.querySelector('[data-popover="true"]') as HTMLElement;

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
			cleanupPopoverAutoUpdate: autoUpdate(referenceEl, floatingEl, () =>
				positionFloatingEl({ referenceEl, floatingEl })
			)
		}));
	}
};
export const closePopover = () => {
	const { referenceEl, floatingEl, cleanupPopoverAutoUpdate } = get(popoverstore);

	if (referenceEl && floatingEl) {
		hideFloatingEl({ floatingEl });
		setFloatingElInteractivity({ floatingEl, enabled: false });
		cleanupPopoverAutoUpdate();

		popoverstore.update((values) => ({
			...values,
			opened: false
		}));
	}
};
export const togglePopover = () => {
	const { opened } = get(popoverstore);
	const { openPopoverOnRibbonHover } = get(settingsStore);

	if (!opened) {
		openPopover();

		if (openPopoverOnRibbonHover) {
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
	console.log('onWindowEvent() > event.target: ', event.target);

	const { referenceEl, floatingEl } = get(popoverstore);

	if (referenceEl && floatingEl) {
		const ev = event as MouseEvent & { target: Node | null };
		const referenceElTouched = referenceEl.contains(ev.target);
		const floatingElTouched = floatingEl.contains(ev.target);

		console.log('referenceEl, floatingEl', referenceEl, floatingEl);
		console.log(floatingElTouched && "🥲🥲🥲🥲🥲🥲🥲🥲 I the floating element have been touched 🥲🥲🥲🥲🥲🥲🥲🥲");

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

		const focusablePopoverElements: HTMLElement[] = Array.from(
			floatingEl?.querySelectorAll(focusableAllowedList)
		);

		const referenceElFocused: boolean = opened && document.activeElement === referenceEl;
		// When the user focuses on 'referenceEl' and then presses the Tab or ArrowDown key, the first element inside the view should receive focus.
		if (
			referenceElFocused &&
			(event.key === 'ArrowDown' || event.key === 'Tab') &&
			focusablePopoverElements.length > 0
		) {
			focusablePopoverElements[0].focus();

			return;
		}

		if (event.key === 'Escape') {
			referenceEl.focus();
			togglePopover();

			return;
		}
	}
};

const setupView = () => {
	if (!getFloatingEl()) {
		new View({
			target: document.body,
			props: { popover: true }
		});

		popoverstore.update((values) => ({
			...values,
			referenceEl: getReferenceEl(),
			floatingEl: getFloatingEl()
		}));
	}
};
// define both onRibbonClicked and onRibbonHovered fns
export const togglePopoverOnClick = ({ plugin }: { plugin: DailyNoteFlexPlugin }) => {
	setupView();
	togglePopover();

	const cleanupPopover = () => {
		popoverstore.update((values) => ({
			...values,
			opened: false,
			referenceEl: null,
			floatingEl: null,
			cleanupPopoverAutoUpdate: () => ({})
		}));

		window.removeEventListener('click', onWindowEvent);

		plugin.popoverCalendar && plugin.popoverCalendar.$destroy();
	};
	return cleanupPopover;
};

export const registerTogglePopoverOnHover = ({ plugin }: { plugin: DailyNoteFlexPlugin }) => {
	setupView();
	const { referenceEl } = get(popoverstore);

	if (referenceEl) {
		referenceEl.addEventListener('mouseover', onRibbonHover);
	}

	const cleanupPopover = () => {
		popoverstore.update((values) => ({
			...values,
			opened: false,
			referenceEl: null,
			floatingEl: null,
			cleanupPopoverAutoUpdate: () => ({})
		}));

		referenceEl && referenceEl.removeEventListener('mouseover', onRibbonHover);
		window.removeEventListener('mouseover', onWindowEvent);
		window.removeEventListener('keydown', onWindowKeyDown);

		plugin.popoverCalendar && plugin.popoverCalendar.$destroy();
	};
	return cleanupPopover;
};
