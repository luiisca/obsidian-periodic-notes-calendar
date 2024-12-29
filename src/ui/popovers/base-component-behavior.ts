import { Component, mount } from "svelte";
import { Popover } from "./base";
import { arrow, autoUpdate, computePosition, flip } from "@floating-ui/dom";
import { BASE_POPOVER_ID, CALENDAR_POPOVER_ID, MODAL_CLASS, STICKER_POPOVER_ID } from "@/constants";
import { type TWindowEvents, type WindowEventHandler } from "../types";
import { get } from "svelte/store";
import { settingsStore } from "@/settings";

export type TBasePopoverParams = {
    id: typeof BASE_POPOVER_ID,
    view: {
        Component: Component;
        props?: Record<string, any>;
    },
    cbs?: {
        onOpen?: () => void,
        onClose?: () => void,
    }
}
export type TBasePopoverId = typeof STICKER_POPOVER_ID | typeof CALENDAR_POPOVER_ID | typeof BASE_POPOVER_ID

export class BaseComponentBehavior {
    public componentHtmlEl: HTMLElement;
    public component: Record<string, any>;
    public autoUpdateCleanup: (() => void) | null | undefined;
    public boundCallbacks = new Map();
    public opened = false;

    constructor(
        public id: TBasePopoverId,
        view: {
            Component: Component;
            props?: Record<string, any>;
        },
        public cbs?: {
            onOpen?: () => void,
            onClose?: () => void,
        }
    ) {
        this.component = mount(view.Component, {
            target: document.body,
            props: {
                close: this.close,
                ...view.props
            }
        });
        this.componentHtmlEl = document.querySelector(`#${id}[data-popover="true"]`) as HTMLElement;
    }

    public toggle(param: Element) {
        if (this.opened) {
            this.close()
        } else {
            this.open(param)
        }
    }

    public open(refHtmlEl: Element, addDefaultEvListners = true, positionFloatingUI = true) {
        this.opened = true;

        // close all popovers when a new modal is displayed to prevent overlapping
        if (!Popover.mutationObserverStarted) {
            const cb = (mutationRecords: MutationRecord[]) => {
                mutationRecords.forEach((record) => {
                    // @ts-ignore
                    const modalFound = [...record.addedNodes].find((node) => {
                        if (node instanceof HTMLElement) {
                            return node.className.contains(MODAL_CLASS);
                        }
                    });
                    if (modalFound) {
                        Popover.instances.forEach((instance) => instance?.close());

                        mutationObserver.disconnect();
                        Popover.mutationObserverStarted = false;
                    }
                });
            };

            const mutationObserver = new MutationObserver(cb);
            mutationObserver.observe(document.querySelector('body') as HTMLBodyElement, {
                childList: true
            });
        }

        this.show()
        this.setInteractivity(true);

        if (positionFloatingUI) {
            this.positionComponent({ refHtmlEl });
            this.autoUpdateCleanup = autoUpdate(refHtmlEl, this.componentHtmlEl, () => {
                // Check if element is still connected to the DOM
                if (!refHtmlEl.isConnected) {
                    // Clean up the autoUpdate
                    this.autoUpdateCleanup?.();
                    return;
                }

                try {
                    // Additional safety check
                    if (document.contains(refHtmlEl)) {
                        this.positionComponent({ refHtmlEl });
                    } else {
                        this.autoUpdateCleanup?.();
                    }
                } catch (error) {
                    console.warn('Reference element no longer valid:', error);
                    this.autoUpdateCleanup?.();
                }
            })
        }

        addDefaultEvListners && this.addWindowListeners(this.getWindowEvents(), this, this.boundCallbacks);
        this.cbs?.onOpen?.();
    }
    public close() {
        console.log("🔥 closing base popover")
        this.opened = false;

        this.hide();
        this.setInteractivity(false);
        this.autoUpdateCleanup?.();
        this.autoUpdateCleanup = null;

        this.removeWindowListeners(this.getWindowEvents(), this.boundCallbacks);
        this.cbs?.onClose?.();
    }
    public cleanup() {
        // needed to avoid breaking inheritance
    }

    public positionComponent({
        refHtmlEl,
        customX,
        customY
    }: {
        refHtmlEl: Element;
        customX?: number;
        customY?: number;
    }) {
        const arrowEl = document.querySelector(`#${this.id}-arrow`) as HTMLDivElement;
        computePosition(refHtmlEl, this.componentHtmlEl, {
            placement: 'right-start',
            middleware: [flip(), arrow({ element: arrowEl })]
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(this.componentHtmlEl!.style, {
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
    }

    public addWindowListeners(windowEvents: TWindowEvents, popoverInstance: BaseComponentBehavior, boundCallbacks: Map<keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>>) {
        (Object.entries(windowEvents) as [keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>][]).forEach(
            ([evName, cb]) => {
                if (cb) {
                    if (evName === 'mouseover' && !get(settingsStore).openPopoverOnRibbonHover) {
                        return;
                    }
                    const boundCallback = cb.bind(popoverInstance);
                    boundCallbacks.set(evName, boundCallback);

                    window.addEventListener(evName, boundCallback);
                }
            }
        );
    }
    public removeWindowListeners(windowEvents: TWindowEvents, boundCallbacks: Map<keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>>) {
        (Object.entries(windowEvents) as [keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>][]).forEach(
            ([evName]) => {
                const cb = boundCallbacks.get(evName);
                if (cb) {
                    window.removeEventListener(evName, cb);
                }
            }
        )
    }

    public getWindowEvents(): TWindowEvents {
        return {
            click: this.handleWindowClick,
        }
    }
    public handleWindowClick(event: MouseEvent) {
        const ev = event as MouseEvent & { target: HTMLElement | null };


        const baseElTouched =
            this.componentHtmlEl.contains(ev.target) ||
            ev.target?.closest(`[id*=${BASE_POPOVER_ID}]`)

        // close base popover if user clicked anywhere but base popover
        if (!baseElTouched) {
            this.close();
        }
    };

    private show() {
        this.componentHtmlEl.style.display = 'block';
        this.componentHtmlEl.style.opacity = '1';
        this.componentHtmlEl.style.zIndex = '9999';
        this.componentHtmlEl.style.pointerEvents = 'auto';
    }
    private hide() {
        this.componentHtmlEl.style.display = 'none';
        this.componentHtmlEl.style.opacity = '0';
        this.componentHtmlEl.style.zIndex = '-9999';
    }
    private setInteractivity(enabled = true) {
        if (enabled) {
            this.componentHtmlEl.removeAttribute('inert');
        } else {
            this.componentHtmlEl.setAttribute('inert', '');
        }
    }
}
