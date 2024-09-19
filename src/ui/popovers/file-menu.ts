import { FILE_MENU_POPOVER_ID, STICKER_POPOVER_ID } from "@/constants";
import { IGranularity } from "@/io";
import { stickerComponentPropsStore } from "@/stores/popovers";
import { Moment } from "moment";
import { Menu, TFile } from "obsidian";
import StickerPopoverComponent from "../components/StickerPopover.svelte";
import { eventHandlers, isControlPressed } from "../utils";
import { Popover } from "./base";

export type TFileMenuPopoverParams = {
    id: typeof FILE_MENU_POPOVER_ID,
}
export type TFileMenuOpenParams = {
    event: MouseEvent,
    note: TFile | undefined,
    date: Moment,
    granularity: IGranularity,
}

export class FileMenuPopoverBehavior {
    private menu: Menu;
    private refHtmlEl: Element | null = null;

    constructor(params: TFileMenuPopoverParams) {
    }

    public open({ event, note, date, granularity }: TFileMenuOpenParams) {
        this.refHtmlEl = event.target as Element;
        this.menu = new Menu();

        if (note) {
            this.openCustomFileMenu(this.menu, note, granularity, date)
        } else {
            this.menu.addItem((item) => {
                item
                    .setTitle("Create Note")
                    .setIcon("document")
                    .onClick(() => {
                        eventHandlers.onClick({
                            date,
                            createNewSplitLeaf: isControlPressed(event),
                            granularity
                        });
                    });
            });
        }


        // Show the menu
        this.menu.showAtPosition(event);
    }
    public close() {
        this.menu.close()
    }
    public cleanup() {
        this.close();
        this.menu.unload();
    }

    private openCustomFileMenu(menu: Menu, note: TFile, granularity: IGranularity, date: Moment) {
        // Add sections to the menu
        (menu as any).addSections(["title", "open", "action-primary", "action", "info", "view", "system", "", "danger"]);

        // Add title (for mobile)
        if ((window.app as any).isMobile) {
            menu.addItem((item) =>
                item.setSection("title")
                    .setIcon("lucide-file")
                    .setTitle(note.name)
                    .setIsLabel(true)
            );
        }

        // Open in new tab
        menu.addItem((item) =>
            item.setSection("open")
                .setTitle("Open in new tab")
                .setIcon("lucide-file-plus")
                .onClick(() => {
                    window.app.workspace.openLinkText(note.path, "", "tab");
                })
        );

        // Open to the right
        menu.addItem((item) =>
            item.setSection("open")
                .setTitle("Open to the right")
                .setIcon("lucide-separator-vertical")
                .onClick(() => {
                    window.app.workspace.openLinkText(note.path, "", "split");
                })
        );

        // Make a copy
        menu.addItem((item) =>
            item.setSection("action")
                .setTitle("Make a copy")
                .setIcon("lucide-files")
                .onClick(() => {
                    const newPath = (window.app.vault as any).getAvailablePath(note.path, note.extension);
                    window.app.vault.copy(note, newPath).then((newFile) => {
                        window.app.workspace.openLinkText(newFile.path, "", "tab");
                    });
                })
        );

        // Delete
        menu.addItem((item) =>
            (item.setSection("danger")
                .setTitle("Delete")
                .setIcon("lucide-trash-2")
                .onClick(() => {
                    (window.app as any).fileManager.promptForFileDeletion(note);
                }) as any)
                .setWarning(true)
        );

        // Add custom "Add Sticker" option
        menu.addItem((item) =>
            item.setSection("action")
                .setTitle("Add Sticker")
                // .setIcon("smile-plus")
                .setIcon("lucide-smile-plus")
                .onClick(() => {
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

        window.app.workspace.trigger("file-menu", menu, note, "custom-file-menu");
    }
}
