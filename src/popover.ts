import { computePosition, autoUpdate, flip, arrow } from '@floating-ui/dom';
import { get, writable } from 'svelte/store';
import type DailyNoteFlexPlugin from './main';
import { crrFileMenu, settingsStore } from './stores';
import type { ComponentType } from 'svelte';

export interface IPopoverState {
	opened: boolean;
	referenceEl: HTMLElement | null;
	floatingEl: HTMLElement | null;
	cleanupPopoverAutoUpdate: () => void;
	customX?: number;
	customY?: number;
	onWindowEvent?: (event: MouseEvent) => void;
	handleOnReferenceElHovered?: () => void;
	handleOnFloatingElEvent?: (event: MouseEvent) => void;
	handleOnWindowEvent: (event: MouseEvent) => void;
	handleOnWindowKeyDown: (event: KeyboardEvent) => void;
}
export const popoversStore = writable<Record<string, IPopoverState | undefined>>();
const mutationObserverCbStore = writable<((mutationRecords: MutationRecord[]) => void) | null>(
	null
);

export const positionFloatingEl = ({
	referenceEl,
	id,
	customX,
	customY
}: {
	referenceEl: HTMLElement;
	id: string;
	customX?: number;
	customY?: number;
}) => {
	const arrowEl = document.querySelector(`#${id}-arrow`) as HTMLDivElement;
	const floatingEl = getFloatingEl({ id });

	console.log('positionFloatingEl(): 🔥');
	console.log('customX: ', customX);
	console.log('customY: ', customX);

	computePosition(referenceEl, floatingEl, {
		placement: 'right',
		middleware: [flip(), arrow({ element: arrowEl })]
	}).then(({ x, y, placement, middlewareData }) => {
		console.log('about to update floatingEl style!!');
		Object.assign(floatingEl.style, {
			left: `${customX || x}px`,
			top: `${customY || y}px`
		});
		console.log(floatingEl.style);
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
export const getFloatingEl = ({ id }: { id: string }) =>
	document.querySelector(`#${id}[data-popover="true"]`) as HTMLElement;

export const openPopover = ({
	id,
	referenceEl,
	customX,
	customY
}: {
	id: string;
	referenceEl?: HTMLElement;
	customX?: number;
	customY?: number;
}) => {
	console.log('openPopover() > id: ✅', id);

	const popoverState = get(popoversStore)[id];

	// add mutationObserver to look for when any modal is added to the DOM and close popover in response
	if (!get(mutationObserverCbStore)) {
		const mutationObserverCb = (mutationRecords: MutationRecord[]) => {
			mutationRecords.forEach((record) => {
				const modalFound = [...record.addedNodes].find((node) => {
					if (node instanceof HTMLElement) {
						return node.className.contains('modal');
					}
				});
				if (modalFound) {
					// close all popovers and context menus
					const popoversIds = Object.keys(get(popoversStore));
					popoversIds.forEach((id) => closePopover({ id }));

					get(crrFileMenu)?.close();

					// disconnect observer and reset observer cb store
					mutationObserver.disconnect();
					mutationObserverCbStore.set(null);
				}
			});
		};
		mutationObserverCbStore.set(mutationObserverCb);

		const mutationObserver = new MutationObserver(mutationObserverCb);
		mutationObserver.observe(document.querySelector('body') as HTMLBodyElement, {
			childList: true
		});
	}

	if (popoverState) {
		const { , handleOnWindowKeyDown } = popoverState;
		const { openPopoverOnRibbonHover } = get(settingsStore);

		const floatingEl = getFloatingEl({ id });
		const crrReferenceEl = referenceEl || getReferenceEl({ id });

		if (crrReferenceEl && floatingEl) {
			console.log('about to reveal floatingEl > id: ', id);
			console.log('openPopover() > referenceEl: ', referenceEl);

			revealFloatingEl({ floatingEl });
			setFloatingElInteractivity({ floatingEl, enabled: true });

			popoversStore.update((values) => ({
				...values,
				[id]: {
					...values[id],
					opened: true,
					// Trigger Floating UI autoUpdate (open only)
					// https://floating-ui.com/docs/autoUpdate
					cleanupPopoverAutoUpdate: autoUpdate(crrReferenceEl, floatingEl, () =>
						positionFloatingEl({ referenceEl: crrReferenceEl, id, customX, customY })
					)
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
	console.log('popoverOnWindowEvent()');

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
	openOnReferenceElHover = false,
	extraSetup,
	view,
	customX,
	customY,
	onWindowEvent,
	addListeners = true
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
	addListeners?: boolean;
}) => {
	const plugin = window.plugin as DailyNoteFlexPlugin;
	// setup View
	console.log('creating new component! 🧱🧱🧱');
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
			handleOnReferenceElHovered: () => {
				addListeners && onReferenceElHover({ id });
				console.log('ref el hovered 🤯🤯🤯 > id: ', id);
			},
			handleOnWindowEvent: (event: MouseEvent) => {
				addListeners && popoverOnWindowEvent({ event, id });
			},
			handleOnWindowKeyDown: (event) => {
				addListeners && popoverOnWindowKeyDown({ event, id });
			}
		}
	}));

	positionFloatingEl({ referenceEl, id });

	if (openOnReferenceElHover) {
		const { referenceEl, handleOnReferenceElHovered } = get(popoversStore)[id] as IPopoverState;

		console.log(
			'❌❌❌setupPopover() adding mouseover event listener to referenceEl 🤯🤯🤯 > referenceEl: ',
			referenceEl
		);
		if (referenceEl && handleOnReferenceElHovered) {
			referenceEl.addEventListener('mouseover', handleOnReferenceElHovered);
		}
	}

	const cleanup = () => {
		const { handleOnReferenceElHovered, handleOnWindowEvent, handleOnWindowKeyDown } = get(
			popoversStore
		)[id] as IPopoverState;

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

		console.log(`cleaning up popover: ${id} > referenceEl: `, referenceEl);
		referenceEl &&
			handleOnReferenceElHovered &&
			referenceEl.removeEventListener('mouseover', handleOnReferenceElHovered);
		window.removeEventListener('mouseover', handleOnWindowEvent);
		window.removeEventListener('click', handleOnWindowEvent);
		window.removeEventListener('keydown', handleOnWindowKeyDown);

		if (plugin.popovers) {
			Object.values(plugin.popovers).forEach((popover) => popover?.$destroy());
			plugin.popovers = {};
		}
	};

	plugin.popoversCleanups.push(cleanup);

	extraSetup?.();
};
