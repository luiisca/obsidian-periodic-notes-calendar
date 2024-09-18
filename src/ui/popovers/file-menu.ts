import { FILE_MENU_POPOVER_ID, STICKER_POPOVER_ID } from "@/constants";
import { IGranularity } from "@/io";
import { Moment } from "moment";
import { Menu, TFile } from "obsidian";
import { Popover } from "./base";
import StickerPopoverComponent from "../components/StickerPopover.svelte"
import { stickerComponentPropsStore } from "@/stores/popovers";
import { logger } from "@/utils";

export type TFileMenuPopoverParams = {
    id: typeof FILE_MENU_POPOVER_ID,
    note: TFile | undefined,
    date: Moment,
    granularity: IGranularity,
}

export class FileMenuPopoverBehavior {
    private menu: Menu;
    private note: TFile | undefined
    private refHtmlEl: Element | null = null;

    constructor({ note, date, granularity }: TFileMenuPopoverParams) {
        this.note = note
        this.menu = new Menu();
        this.menu.addItem((item) =>
            item.setTitle('Add Sticker').setIcon('smile-plus').onClick(() => {
                if (this.refHtmlEl) {
                    Popover.create({
                        id: STICKER_POPOVER_ID,
                        view: {
                            Component: StickerPopoverComponent,
                        },
                    }).open(this.refHtmlEl)
                }

                stickerComponentPropsStore.set({
                    note,
                    date,
                    granularity
                })
            })
        );
        this.menu.addItem((item) =>
            item
                .setTitle('Delete')
                .setIcon('trash')
                .onClick(() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (<any>window.app).fileManager.promptForFileDeletion(note);
                })
        );
        window.app.workspace.trigger('file-menu', this.menu, this.note, 'calendar-context-menu', null);
    }

    public open(event: MouseEvent) {
        this.refHtmlEl = event.target as Element;
        this.menu.showAtPosition({
            x: event.pageX,
            y: event.pageY
        });
    }
    public close() {
        this.menu.close()
    }
    public cleanup() {
        this.close();
        this.menu.unload();
    }
}
