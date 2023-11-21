import { computePosition, flip, arrow } from '@floating-ui/dom';
import { get, writable } from 'svelte/store';
import type DailyNoteFlexPlugin from '../../main';
import { crrFileMenu } from '../../stores';
import type { ComponentType } from 'svelte';
import { popover as calendarPopover } from './calendar';
import { popover as stickerPopover } from './sticker';
import { CALENDAR_POPOVER_ID, STICKER_POPOVER_ID } from '@/constants';

export interface IpopoverStore {
	opened: boolean;
	referenceEl?: HTMLElement | null;
	floatingEl: HTMLElement | null;
	cleanupPopoverAutoUpdate: () => void;
	customX?: number;
	customY?: number;
}
export type TPopovers = typeof CALENDAR_POPOVER_ID | typeof STICKER_POPOVER_ID;
// TODO : Wrap WindowEventMap in optional generic
export type TWindowEvents =
	| Record<keyof WindowEventMap, (event: MouseEvent) => void>
	| Record<keyof WindowEventMap, (event: KeyboardEvent) => void>;

export interface IPopoverUtils {
	open: ({
		referenceEl,
		customX,
		customY
	}: {
		referenceEl?: HTMLElement;
		customX?: number;
		customY?: number;
	}) => void;
	close?: () => void;
	extraSetup: () => void;
	cleanup: () => void;
	windowEvents?: TWindowEvents;
	addWindowEvents: () => void;
	removeWindowEvents: () => void;
}

export const popoversStore = writable<Record<string, IpopoverStore | undefined>>();

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
	id: TPopovers;
	customX?: number;
	customY?: number;
}) => {
	const arrowEl = document.querySelector(`#${id}-arrow`) as HTMLDivElement;
	const floatingEl = getFloatingEl({ id });

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
export const revealFloatingEl = ({ floatingEl }: { floatingEl: HTMLElement }) => {
	floatingEl.style.display = 'block';
	floatingEl.style.opacity = '1';
	floatingEl.style.pointerEvents = 'auto';

	console.log('🙌 revealFloatingEl() > opacity: ', floatingEl.style.opacity);
};
export const hideFloatingEl = ({ floatingEl }: { floatingEl: HTMLElement }) => {
	floatingEl.style.opacity = '0';

	console.log('🙌 hideFloatingEl() > opacity: ', floatingEl.style.opacity);
};
export const setFloatingElInteractivity = ({
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

export const getFloatingEl = ({ id }: { id: TPopovers }) =>
	document.querySelector(`#${id}[data-popover="true"]`) as HTMLElement;

export const openPopover = ({
	id,
	referenceEl,
	customX,
	customY
}: {
	id: TPopovers;
	referenceEl?: HTMLElement;
	customX?: number;
	customY?: number;
}) => {
	console.log('openPopover() > id: ✅', id);

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
					const popoversIds = Object.keys(get(popoversStore)) as TPopovers[];
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

	popovers[id].open({ referenceEl, customX, customY });

	popovers[id].addWindowEvents();
};
export const closePopover = ({ id }: { id: TPopovers }) => {
	console.log('closePopover() > id: ❌', id);
	const popoverStore = get(popoversStore)[id];

	if (popoverStore) {
		const { referenceEl, floatingEl, cleanupPopoverAutoUpdate } = popoverStore;

		if (referenceEl && floatingEl) {
			hideFloatingEl({ floatingEl });
			setFloatingElInteractivity({ floatingEl, enabled: false });
			cleanupPopoverAutoUpdate();

			popoversStore.update((values) => ({
				...values,
				[id]: {
					...values[id],
					opened: false
				} as IpopoverStore
			}));
		}
	}

	popovers[id].close?.();
	popovers[id].removeWindowEvents();
};
export const togglePopover = ({ id }: { id: TPopovers }) => {
	const popoverStore = get(popoversStore)[id];
	if (popoverStore) {
		const { opened } = popoverStore;

		if (!opened) {
			openPopover({ id });
		} else {
			closePopover({ id });
		}
	}
};

export const setupPopover = ({
	id,
	referenceEl,
	view
}: {
	id: TPopovers;
	referenceEl?: HTMLElement;
	view: {
		Component: ComponentType;
		props?: Record<string, unknown>;
	};
}) => {
	const plugin = window.plugin as DailyNoteFlexPlugin;
	// setup View
	plugin.popovers[id] = new view.Component({
		target: document.body,
		props: { popover: true, close: () => closePopover({ id }), ...view.props }
	});

	const emojiPicker = document.querySelector('em-emoji-picker');
	const shadowRoot = emojiPicker?.shadowRoot;

	popoversStore.update((values) => ({
		...values,
		[id]: {
			opened: false,
			referenceEl,
			floatingEl: getFloatingEl({ id }),
			cleanupPopoverAutoUpdate: () => ({})
		}
	}));

	popovers[id].extraSetup();
	plugin.popoversCleanups.push(popovers[id].cleanup);
};

export const popovers: Record<TPopovers, IPopoverUtils> = {
	[CALENDAR_POPOVER_ID]: calendarPopover,
	[STICKER_POPOVER_ID]: stickerPopover
};
