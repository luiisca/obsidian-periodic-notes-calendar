import { computePosition, autoUpdate, flip, arrow } from '@floating-ui/dom';
import { get, writable } from 'svelte/store';
import type DailyNoteFlexPlugin from './main';
import { settingsStore } from './stores';
import type { ComponentType } from 'svelte';

export interface IPopoverState {
	opened: boolean;
	referenceEl: HTMLElement | null;
	floatingEl: HTMLElement | null;
	cleanupPopoverAutoUpdate: () => void;
	customX?: number;
	customY?: number;
	onWindowEvent?: (event: MouseEvent) => void;
	handleOnFloatingElEvent?: (event: MouseEvent) => void;
	handleOnWindowEvent: (event: MouseEvent) => void;
	handleOnWindowKeyDown: (event: KeyboardEvent) => void;
}
export const popoversStore = writable<Record<string, IPopoverState | undefined>>();

const positionFloatingEl = ({
	referenceEl,
	floatingEl,
	id,
}: {
	referenceEl: HTMLElement;
	floatingEl: HTMLElement;
	id: string;
}) => {
	const arrowEl = document.querySelector(`#${id}-arrow`) as HTMLDivElement;
	const { customX, customY } = get(popoversStore)[id] as IPopoverState;

	computePosition(referenceEl, floatingEl, {
		placement: 'right',
		middleware: [flip(), arrow({ element: arrowEl })]
	}).then(({ x, y, placement, middlewareData }) => {
		Object.assign(floatingEl.style, {
			left: `${customX || x}px`,
			top: `${customY || y}px`
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

	console.log('🙌 revealFloatingEl() > opacity: ', floatingEl.style.opacity);
};
const hideFloatingEl = ({ floatingEl }: { floatingEl: HTMLElement }) => {
	floatingEl.style.opacity = '0';

	console.log('🙌 hideFloatingEl() > opacity: ', floatingEl.style.opacity);
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

const getReferenceEl = ({ id }: { id: string }) =>
	document.querySelector(`[id=${id}-reference-el]`) as HTMLElement;
const getFloatingEl = ({ id }: { id: string }) =>
	document.querySelector(`#${id}[data-popover="true"]`) as HTMLElement;

export const openPopover = ({ id }: { id: string }) => {
	console.log('openPopover() > id: ✅', id);

	const popoverState = get(popoversStore)[id];

	if (popoverState) {
		const { referenceEl, floatingEl, handleOnWindowEvent, handleOnWindowKeyDown } = popoverState;
		const { openPopoverOnRibbonHover } = get(settingsStore);

		if (referenceEl && floatingEl) {
			console.log('about to reveal floatingEl > id: ', id);

			revealFloatingEl({ floatingEl });
			setFloatingElInteractivity({ floatingEl, enabled: true });

			popoversStore.update((values) => ({
				...values,
				[id]: {
					...values[id],
					opened: true,
					// Trigger Floating UI autoUpdate (open only)
					// https://floating-ui.com/docs/autoUpdate
					// cleanupPopoverAutoUpdate: autoUpdate(referenceEl, floatingEl, () =>
					// 	positionFloatingEl({ referenceEl, floatingEl, id })
					// )
				} as IPopoverState
			}));
		}

		openPopoverOnRibbonHover && window.addEventListener('mouseover', handleOnWindowEvent);
		window.addEventListener('click', handleOnWindowEvent);
		window.addEventListener('keydown', handleOnWindowKeyDown);
	}
};
export const closePopover = ({ id }: { id: string }) => {
	console.log('closePopover() > id: ❌', id);
	const popoverState = get(popoversStore)[id];

	if (popoverState) {
		const {
			referenceEl,
			floatingEl,
			cleanupPopoverAutoUpdate,
			handleOnWindowEvent,
			handleOnWindowKeyDown
		} = popoverState;

		if (referenceEl && floatingEl) {
			hideFloatingEl({ floatingEl });
			setFloatingElInteractivity({ floatingEl, enabled: false });
			cleanupPopoverAutoUpdate();

			popoversStore.update((values) => ({
				...values,
				[id]: {
					...values[id],
					opened: false
				} as IPopoverState
			}));
		}
		window.removeEventListener('mouseover', handleOnWindowEvent);
		window.removeEventListener('click', handleOnWindowEvent);
		window.removeEventListener('keydown', handleOnWindowKeyDown);
	}
};
export const togglePopover = ({ id }: { id: string }) => {
	const popoverState = get(popoversStore)[id];
	if (popoverState) {
		const { opened } = popoverState;

		console.log('ID: ', id.toUpperCase());
		console.log('togglePopover() > opened: ', opened);

		if (!opened) {
			openPopover({ id });
		} else {
			closePopover({ id });
		}
	}
};

// event listeners
let handlePopoverOnReferenceElHover: (event: MouseEvent) => void;

const onReferenceElHover = ({ id }: { id: string }) => {
	const { opened, handleOnWindowEvent, handleOnWindowKeyDown } = get(popoversStore)[
		id
	] as IPopoverState;

	if (!opened) {
		openPopover({ id });

		window.addEventListener('mouseover', handleOnWindowEvent);
		window.addEventListener('keydown', handleOnWindowKeyDown);
	}
};

export const popoverOnWindowEvent = ({ event, id }: { event: MouseEvent; id: string }) => {
	console.log('ID: ', id.toUpperCase());
	console.log('popoverOnWindowEvent() > event.target: ', event.target);

	const popoverState = get(popoversStore)[id];
	if (popoverState) {
		const { referenceEl, floatingEl, onWindowEvent } = popoverState;

		if (referenceEl && floatingEl) {
			const ev = event as MouseEvent & { target: Node | null };
			const referenceElTouched = referenceEl.contains(ev.target);

			if (referenceElTouched) return;

			onWindowEvent?.(event);
		}
	}
};

// Accessibility Keyboard Interactions
const popoverOnWindowKeyDown = ({ event, id }: { event: KeyboardEvent; id: string }) => {
	event.preventDefault();
	const { referenceEl, floatingEl, opened } = get(popoversStore)[id] as IPopoverState;

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
			togglePopover({ id });

			return;
		}
	}
};

export const setupPopover = ({
	id,
	referenceEl = getReferenceEl({ id }),
	openOnReferenceElHover,
	extraSetup,
	view,
	customX,
	customY,
	onWindowEvent,
	callback
}: {
	id: string;
	referenceEl?: HTMLElement;
	openOnReferenceElHover?: boolean;
	extraSetup?: () => void;
	view: {
		Component: ComponentType;
		props?: Record<string, unknown>;
	};
	customX?: number;
	customY?: number;
	onWindowEvent?: (event: MouseEvent) => void;
	callback?: () => void;
}) => {
	const plugin = window.plugin as DailyNoteFlexPlugin;
	// setup View
	console.log(
		'setupPopover() > getFloatingEl({id}): ',
		getFloatingEl({ id }),
		'popovers',
		plugin.popovers,
		plugin.popovers?.[id]
	);
	if (!getFloatingEl({ id }) && !plugin.popovers[id]) {
		plugin.popovers[id] = new view.Component({
			target: document.body,
			props: { popover: true, close: () => closePopover({ id }), ...view.props }
		});

		popoversStore.update((values) => ({
			...values,
			[id]: {
				opened: false,
				referenceEl,
				floatingEl: getFloatingEl({ id }),
				cleanupPopoverAutoUpdate: () => ({}),
				customX,
				customY,
				onWindowEvent,
				handleOnWindowEvent: (event: MouseEvent) => {
					popoverOnWindowEvent({ event, id });
				},
				handleOnWindowKeyDown: (event) => {
					popoverOnWindowKeyDown({ event, id });
				}
			}
		}));

		positionFloatingEl({ referenceEl, floatingEl: getFloatingEl({ id }), id});
	}

	extraSetup?.();

	handlePopoverOnReferenceElHover = (event: MouseEvent) => {
		// console.log('handlePopoverOnReferenceElHOver() > id: ', id, event);
		onReferenceElHover({ id });
	};

	if (openOnReferenceElHover) {
		const { referenceEl } = get(popoversStore)[id] as IPopoverState;

		// console.log('setupPopover() > referenceEl: ', referenceEl, !!referenceEl);
		if (referenceEl) {
			// console.log('about to event listener to referenceEl! 🚵🏿');
			referenceEl.addEventListener('mouseover', handlePopoverOnReferenceElHover);
		}
	}

	const cleanupPopover = () => {
		const { handleOnWindowEvent, handleOnWindowKeyDown } = get(popoversStore)[id] as IPopoverState;

		popoversStore.update((values) => ({
			...values,
			[id]: {
				opened: false,
				referenceEl: null,
				floatingEl: null,
				cleanupPopoverAutoUpdate: () => ({}),
				handleOnWindowEvent: () => ({}),
				handleOnWindowKeyDown: () => ({})
			}
		}));

		referenceEl && referenceEl.removeEventListener('mouseover', handlePopoverOnReferenceElHover);
		window.removeEventListener('mouseover', handleOnWindowEvent);
		window.removeEventListener('keydown', handleOnWindowKeyDown);

		if (plugin.popovers) {
			Object.values(plugin.popovers).forEach((popover) => popover?.$destroy());
		}
	};

	return cleanupPopover;
};
