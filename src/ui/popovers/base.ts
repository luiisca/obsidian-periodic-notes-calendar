import { BASE_POPOVER_ID } from "@/constants";
import { BaseComponentBehavior, TBasePopoverParams } from "./base-component-behavior";
import { CalendarPopoverBehavior, type TCalendarPopoverParams } from "./calendar";
import { FileMenuPopoverBehavior, type FileMenuOpenParams } from "./file-menu";
import { StickerPopoverBehavior, type TStickerPopoverParams } from "./sticker";

export class Popover<T extends CalendarPopoverBehavior | StickerPopoverBehavior | FileMenuPopoverBehavior | BaseComponentBehavior> {
  static calendarSingleton: Popover<CalendarPopoverBehavior> | null = null;
  static stickerSingleton: Popover<StickerPopoverBehavior> | null = null;
  static fileMenuSingleton: Popover<FileMenuPopoverBehavior> | null = null;
  static baseSingleton: Popover<BaseComponentBehavior> | null = null;
  open: (param: FileMenuOpenParams | Element) => void;
  close: () => void;
  toggle: (param: FileMenuOpenParams | Element) => void;
  cleanup: () => void;

  static mutationObserverStarted = false;

  constructor(public behaviors: T) {
    this.open = behaviors.open.bind(behaviors);
    this.close = behaviors.close.bind(behaviors);
    this.toggle = behaviors.toggle.bind(behaviors);
    this.cleanup = behaviors.cleanup.bind(behaviors);
  }

  static cleanup() {
    Popover.calendarSingleton = null;
    Popover.stickerSingleton = null;
    Popover.fileMenuSingleton = null;
    Popover.baseSingleton = null;

    Popover.mutationObserverStarted = false;
  }

  static closeAll() {
    Popover.calendarSingleton?.close();
    Popover.stickerSingleton?.close();
    Popover.fileMenuSingleton?.close();
    Popover.baseSingleton?.close();
  }
}

export const createCalendarPopover = (params: TCalendarPopoverParams) => {
  if (!Popover.calendarSingleton) {
    Popover.calendarSingleton = new Popover(new CalendarPopoverBehavior(params))
  }
  return Popover.calendarSingleton
}
export const createStickerPopover = (params: TStickerPopoverParams) => {
  if (!Popover.stickerSingleton) {
    Popover.stickerSingleton = new Popover(new StickerPopoverBehavior(params))
  }
  return Popover.stickerSingleton
}
export const createFileMenuPopover = () => {
  if (!Popover.fileMenuSingleton) {
    Popover.fileMenuSingleton = new Popover(new FileMenuPopoverBehavior())
  }
  return Popover.fileMenuSingleton
}
export const createBasePopover = (params: TBasePopoverParams) => {
  if (!Popover.baseSingleton) {
    Popover.baseSingleton = new Popover(new BaseComponentBehavior(BASE_POPOVER_ID, params.view, params.cbs))
  }
  return Popover.baseSingleton
}
