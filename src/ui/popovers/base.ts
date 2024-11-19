import { BASE_POPOVER_ID, CALENDAR_POPOVER_ID, FILE_MENU_POPOVER_ID, STICKER_POPOVER_ID } from "@/constants";
import { BaseComponentBehavior, TBasePopoverId, TBasePopoverParams } from "./base-component-behavior";
import { CalendarPopoverBehavior, type TCalendarPopoverParams } from "./calendar";
import { FileMenuPopoverBehavior, type TFileMenuOpenParams, type TFileMenuPopoverParams } from "./file-menu";
import { StickerPopoverBehavior, type TStickerPopoverParams } from "./sticker";

export type TPopoverId = TBasePopoverId | typeof FILE_MENU_POPOVER_ID;
export type TPopoverParams = TCalendarPopoverParams | TStickerPopoverParams | TFileMenuPopoverParams | TBasePopoverParams;

export class Popover {
    static instances = new Map<TPopoverId, Popover>();
    static behaviorInstances = new Map<TPopoverId, ReturnType<typeof createBehavior>>();
    static mutationObserverStarted = false;

    constructor(
        private id: TPopoverId,
        private behavior: BaseComponentBehavior | FileMenuPopoverBehavior,
    ) { }

    static create(params: TPopoverParams) {
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

    public toggle(param: TFileMenuOpenParams | Element) {
        if (param instanceof Element) {
            (this.behavior as BaseComponentBehavior).toggle(param);
        } else if (typeof param === "object") {
            (this.behavior as FileMenuPopoverBehavior).toggle(param as TFileMenuOpenParams);
        }
    }
    public open(param: TFileMenuOpenParams | Element) {
        if (param instanceof Element) {
            (this.behavior as BaseComponentBehavior).open(param);
        } else if (typeof param === "object") {
            (this.behavior as FileMenuPopoverBehavior).open(param as TFileMenuOpenParams);
        }
    }

    public close() {
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
        default:
            return new BaseComponentBehavior(params.id, params.view, params.cbs);
    }
}

export function getPopoverInstance(id: TPopoverId) {
    return Popover.instances.get(id);
}
export function getBehaviorInstance(id: typeof CALENDAR_POPOVER_ID): CalendarPopoverBehavior | undefined;
export function getBehaviorInstance(id: typeof STICKER_POPOVER_ID): StickerPopoverBehavior | undefined;
export function getBehaviorInstance(id: typeof BASE_POPOVER_ID): BaseComponentBehavior | undefined;
export function getBehaviorInstance(id: typeof FILE_MENU_POPOVER_ID): FileMenuPopoverBehavior | undefined;
export function getBehaviorInstance(id: TPopoverId): CalendarPopoverBehavior | StickerPopoverBehavior | BaseComponentBehavior | FileMenuPopoverBehavior | undefined {
    return Popover.behaviorInstances.get(id);
}
