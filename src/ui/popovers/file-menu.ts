import { FILE_MENU_POPOVER_ID, STICKER_POPOVER_ID } from "@/constants";
import { TFileData, type IGranularity } from "@/io";
import { spFileDataStore } from "@/stores";
import { type Moment } from "moment";
import { Menu } from "obsidian";
import StickerPopoverComponent from "../components/StickerPopover.svelte";
import { eventHandlers, isControlPressed } from "../utils";
import { Popover } from "./base";

export type TFileMenuPopoverParams = {
    id: typeof FILE_MENU_POPOVER_ID,
}
export type TFileMenuOpenParams = {
    event: MouseEvent,
    fileData: TFileData,
    date: Moment,
    granularity: IGranularity,
}

export class FileMenuPopoverBehavior {
    private menu: Menu | null = null;
    private refHtmlEl: Element | null = null;

    constructor(params: TFileMenuPopoverParams) {
        // Do nothing
    }

    public open({ event, fileData, date, granularity }: TFileMenuOpenParams) {
        this.refHtmlEl = event.target as Element;
        this.menu = new Menu();

        if (fileData) {
            this.openCustomFileMenu(this.menu, fileData)
        } else {
            this.menu.addItem((item) => {
                item
                    .setTitle("Create Note")
                    .setIcon("document")
                    .onClick(() => {
                        eventHandlers.onClick({
                            date,
                            granularity,
                            createNewSplitLeaf: isControlPressed(event)
                        });
                    });
            });
        }


        // Show the menu
        this.menu.showAtPosition(event);
    }
    public close() {
        this.menu?.close()
    }
    public cleanup() {
        this.close();
        this.menu?.unload();
    }

    private openCustomFileMenu(menu: Menu, fileData: TFileData) {
        const file = fileData.file;
        if (file) {
            // Add sections to the menu
            (menu as any).addSections(["title", "open", "action-primary", "action", "info", "view", "system", "", "danger"]);

            // Add title (for mobile)
            if ((window.app as any).isMobile) {
                menu.addItem((item) =>
                    item.setSection("title")
                        .setIcon("lucide-file")
                        .setTitle(file.name)
                        .setIsLabel(true)
                );
            }

            // Open in new tab
            menu.addItem((item) =>
                item.setSection("open")
                    .setTitle("Open in new tab")
                    .setIcon("lucide-file-plus")
                    .onClick(() => {
                        window.app.workspace.openLinkText(file.path, "", "tab");
                    })
            );

            // Open to the right
            menu.addItem((item) =>
                item.setSection("open")
                    .setTitle("Open to the right")
                    .setIcon("lucide-separator-vertical")
                    .onClick(() => {
                        window.app.workspace.openLinkText(file.path, "", "split");
                    })
            );

            // Make a copy
            menu.addItem((item) =>
                item.setSection("action")
                    .setTitle("Make a copy")
                    .setIcon("lucide-files")
                    .onClick(() => {
                        const newPath = (window.app.vault as any).getAvailablePath(file.path, file.extension);
                        window.app.vault.copy(file, newPath).then((newFile) => {
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
                        (window.app as any).fileManager.promptForFileDeletion(file);
                    }) as any)
                    .setWarning(true)
            );

            // Add custom "Add Sticker" option
            menu.addItem((item) =>
                item.setSection("action")
                    .setTitle("Add Sticker")
                    .setIcon("lucide-smile-plus")
                    .onClick(() => {
                        if (this.refHtmlEl) {
                            spFileDataStore.set(fileData);
                            Popover.create({
                                id: STICKER_POPOVER_ID,
                                view: {
                                    Component: StickerPopoverComponent,
                                },
                            }).open(this.refHtmlEl)
                        }
                    })
            );

            window.app.workspace.trigger("file-menu", menu, file, "custom-file-menu");
        }
    }
}
