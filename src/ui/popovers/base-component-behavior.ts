import { ComponentType, SvelteComponent } from "svelte";
import { Popover } from "./base";
import { arrow, autoUpdate, computePosition, flip } from "@floating-ui/dom";
import { CALENDAR_POPOVER_ID, MODAL_CLASS, STICKER_POPOVER_ID } from "@/constants";
import { TWindowEvents, WindowEventHandler } from "../types";
import { get } from "svelte/store";
import { settingsStore }  from "@/settings";

export class BaseComponentBehavior {
    public componentHtmlEl: HTMLElement;
    public component: SvelteComponent;
    public autoUpdateCleanup: (() => void) | null;

    constructor(
        public id: typeof STICKER_POPOVER_ID | typeof CALENDAR_POPOVER_ID,
        view: {
            Component: ComponentType;
            props?: Record<string, unknown>;
        },
        public refHtmlEl: HTMLElement
    ) {
        this.component = new view.Component({
            target: document.body,
            props: {
                popover: true,
                close: this.close,
                ...view.props
            }
        });
        this.componentHtmlEl = document.querySelector(`#${id}[data-popover="true"]`) as HTMLElement;
    }

    public open() {
        // close all popovers when a new modal is displayed to prevent overlapping
        if (!Popover.mutationObserverStarted) {
            const cb = (mutationRecords: MutationRecord[]) => {
                mutationRecords.forEach((record) => {
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
        this.positionComponent({ refHtmlEl: this.refHtmlEl });
        this.autoUpdateCleanup = autoUpdate(this.refHtmlEl, this.componentHtmlEl, () => {
            this.positionComponent({ refHtmlEl: this.refHtmlEl!! });
        })
    }
    public close() {
        this.hide();
        this.setInteractivity(false);
        this.autoUpdateCleanup?.();
        this.autoUpdateCleanup = null;
    }
    public cleanup() {
    }

    public positionComponent({
        refHtmlEl,
        customX,
        customY
    }: {
        refHtmlEl: HTMLElement;
        customX?: number;
        customY?: number;
    }) {
        const arrowEl = document.querySelector(`#${this.id}-arrow`) as HTMLDivElement;
        computePosition(refHtmlEl, this.componentHtmlEl, {
            placement: 'right',
            middleware: [flip(), arrow({ element: arrowEl })]
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(this.componentHtmlEl!!.style, {
                left: `${customX || x} px`,
                top: `${customY || y} px`
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
                        left: arrowX != null ? `${arrowX} px` : '',
                        top: arrowY != null ? `${arrowY} px` : '',
                        right: '',
                        bottom: '',
                        [staticSide]: '9px'
                    });
            }
        });
    }

    public addWindowListeners(windowEvents: TWindowEvents) {
        (Object.entries(windowEvents) as [keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>][]).forEach(
            ([evName, cb]) => {
                if (cb) {
                    if (evName === 'mouseover' && !get(settingsStore).openPopoverOnRibbonHover) {
                        return;
                    }

                    window.addEventListener(evName, cb);
                }
            }
        );
    }
    public removeWindowListeners(windowEvents: TWindowEvents) {
        (Object.entries(windowEvents) as [keyof WindowEventMap, WindowEventHandler<keyof WindowEventMap>][]).forEach(
            ([evName, cb]) => {
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
    private setInteractivity(enabled: boolean = true) {
        if (enabled) {
            this.componentHtmlEl.removeAttribute('inert');
        } else {
            this.componentHtmlEl.setAttribute('inert', '');
        }
    }
}
