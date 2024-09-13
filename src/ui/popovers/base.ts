import { CALENDAR_POPOVER_ID, FILE_MENU_POPOVER_ID, STICKER_POPOVER_ID } from "@/constants";
import { BaseComponentBehavior } from "./base-component-behavior";
import { CalendarPopoverBehavior, TCalendarPopoverParams } from "./calendar";
import { FileMenuPopoverBehavior, TFileMenuPopoverParams } from "./file-menu";
import { StickerPopoverBehavior, TStickerPopoverParams } from "./sticker";

export type TPopoverType = typeof CALENDAR_POPOVER_ID | typeof STICKER_POPOVER_ID | typeof FILE_MENU_POPOVER_ID;
export type TPopoverParams = TCalendarPopoverParams | TStickerPopoverParams | TFileMenuPopoverParams;

export class Popover {
    static instances = new Map<TPopoverType, Popover>();
    static behaviorInstances = new Map<TPopoverType, ReturnType<typeof createBehavior>>();
    static mutationObserverStarted = false;
    public opened: boolean = false;

    constructor(
        private id: TPopoverType,
        private behavior: BaseComponentBehavior | FileMenuPopoverBehavior,
    ) { }

    static create(params: TCalendarPopoverParams | TStickerPopoverParams | TFileMenuPopoverParams) {
        let popover = getPopoverInstance(params.id);
        if (!popover) {
            const behavior = createBehavior(params);
            popover = new Popover(params.id, behavior);
            Popover.instances.set(params.id, popover);
            Popover.behaviorInstances.set(params.id, behavior);
        }

        return popover;
    }
    static cleanup() {
        Popover.instances.forEach((popover) => popover.cleanup());
        Popover.instances.clear();
        Popover.mutationObserverStarted = false;
    }

    public toggle() {
        if (this.opened) {
            this.close();
        } else {
            this.open();
        }
    }
    public open() {
        this.opened = true;
        this.behavior.open()
    }

    public close() {
        this.opened = false;
        this.behavior.close();
    }
    public cleanup() {
        this.behavior.cleanup();
    }
}

function createBehavior(params: TPopoverParams) {
    switch (params.id) {
        case CALENDAR_POPOVER_ID:
            return new CalendarPopoverBehavior(params);
        case STICKER_POPOVER_ID:
            return new StickerPopoverBehavior(params);
        case FILE_MENU_POPOVER_ID:
            return new FileMenuPopoverBehavior(params);
    }
}

export function getPopoverInstance(id: TPopoverType) {
    return Popover.instances.get(id);
}
export function getBehaviorInstance(id: typeof CALENDAR_POPOVER_ID): CalendarPopoverBehavior | undefined;
export function getBehaviorInstance(id: typeof STICKER_POPOVER_ID): StickerPopoverBehavior | undefined;
export function getBehaviorInstance(id: typeof FILE_MENU_POPOVER_ID): FileMenuPopoverBehavior | undefined;
export function getBehaviorInstance(id: TPopoverType): CalendarPopoverBehavior | StickerPopoverBehavior | FileMenuPopoverBehavior | undefined {
    return Popover.behaviorInstances.get(id);
}
