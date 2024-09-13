import { FILE_MENU_POPOVER_ID, STICKER_POPOVER_ID } from "@/constants";
import { IGranularity } from "@/io";
import { Moment } from "moment";
import { Menu, TFile } from "obsidian";
import { Popover } from "./base";
import StickerPopoverComponent from "../components/StickerPopover.svelte"
import { stickerComponentPropsStore } from "@/stores/popovers";

export type TFileMenuPopoverParams = {
    id: typeof FILE_MENU_POPOVER_ID,
    note: TFile | undefined,
    event: MouseEvent,
    date: Moment,
    granularity: IGranularity,
}

export class FileMenuPopoverBehavior {
    private menu: Menu;
    private note: TFile | undefined

    constructor({ note, event, date, granularity }: TFileMenuPopoverParams) {
        this.note = note
        this.menu = new Menu();
        this.menu.addItem((item) =>
            item.setTitle('Add Sticker').setIcon('smile-plus').onClick(() => {
                Popover.create({
                    id: STICKER_POPOVER_ID,
                    view: {
                        Component: StickerPopoverComponent,
                    },
                    refHtmlEl: event.target as HTMLElement
                }).open()

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
        this.menu.showAtPosition({
            x: event.pageX,
            y: event.pageY
        });
    }

    public open() {
        window.app.workspace.trigger('file-menu', this.menu, this.note, 'calendar-context-menu', null);
    }
    public close() {
        this.menu.close()
    }
    public cleanup() {
        this.close();
        this.menu.unload();
    }
}
