import { Component, mount } from "svelte";
import { Popover } from "./base";
import { arrow, autoUpdate, computePosition, flip } from "@floating-ui/dom";
import { CALENDAR_POPOVER_ID, MODAL_CLASS, STICKER_POPOVER_ID } from "@/constants";
import { type TWindowEvents, type WindowEventHandler } from "../types";
import { get } from "svelte/store";
import { settingsStore } from "@/settings";

export class BaseComponentBehavior {
    public componentHtmlEl: HTMLElement;
    public component: Record<string, any>;
    public autoUpdateCleanup: (() => void) | null | undefined;

    constructor(
        public id: typeof STICKER_POPOVER_ID | typeof CALENDAR_POPOVER_ID,
        view: {
            Component: Component;
            props?: Record<string, any>;
        },
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

    public open(refHtmlEl: Element) {
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
        this.positionComponent({ refHtmlEl });
        this.autoUpdateCleanup = autoUpdate(refHtmlEl, this.componentHtmlEl, () => {
            this.positionComponent({ refHtmlEl });
        })
    }
    public close() {
        this.hide();
        this.setInteractivity(false);
        this.autoUpdateCleanup?.();
        this.autoUpdateCleanup = null;
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

    private show() {
        this.componentHtmlEl.style.display = 'block';
        this.componentHtmlEl.style.opacity = '1';
        this.componentHtmlEl.style.pointerEvents = 'auto';
    }
    private hide() {
        this.componentHtmlEl.style.opacity = '0';
    }
    private setInteractivity(enabled = true) {
        if (enabled) {
            this.componentHtmlEl.removeAttribute('inert');
        } else {
            this.componentHtmlEl.setAttribute('inert', '');
        }
    }
}
