import { FILE_MENU_POPOVER_ID, STICKER_POPOVER_ID } from "@/constants";
import { TFileData, type IGranularity } from "@/io";
import { activeFilepathStore, displayedDateStore, spFileDataStore } from "@/stores";
import { type Moment } from "moment";
import { Menu } from "obsidian";
import StickerPopoverComponent from "../components/StickerPopover.svelte";
import { eventHandlers, isControlPressed } from "../utils";
import { Popover } from "./base";
import { ViewManager } from "../components";

export type TFileMenuPopoverParams = {
    id: typeof FILE_MENU_POPOVER_ID,
}
export type TFileMenuOpenParams = {
    event: MouseEvent,
    fileData: TFileData,
    date: Moment,
    granularity?: IGranularity,
    extraItems?: {
        add: (menu: Menu) => void,
        newSections: string[]
    },
}

export class FileMenuPopoverBehavior {
    private menu: Menu | null = null;
    private refHtmlEl: Element | null = null;
    public opened = false;

    constructor(params: TFileMenuPopoverParams) {
        // Do nothing
    }

    public toggle(param: TFileMenuOpenParams) {
        if (this.opened) {
            this.close()
        } else {
            this.open(param)
        }
    }

    public open({ event, fileData, date, granularity, extraItems }: TFileMenuOpenParams) {
        this.opened = true;

        this.refHtmlEl = event.target as Element;
        this.menu = new Menu();

        if (fileData.file) {
            this.openCustomFileMenu(this.menu, fileData, date, granularity, extraItems)
        } else if (date && granularity) {
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
        this.opened = false;

        this.menu?.close()
    }
    public cleanup() {
        this.close();
        this.menu?.unload();
    }

    private openCustomFileMenu(menu: Menu, fileData: TFileData, date: Moment, granularity?: IGranularity, extraItems?: TFileMenuOpenParams['extraItems']) {
        const file = fileData.file;
        if (file) {
            // Add sections to the menu
            (menu as any).addSections([...(extraItems?.newSections || []), "title", "open", "action-primary", "action", "info", "view", "system", "", "danger"]);

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
            // Open preview
            menu.addItem((item) =>
                item.setSection("open")
                    .setTitle("Open in preview window")
                    .setIcon("lucide-eye")
                    .onClick(() => {
                        ViewManager.initPreview(file, true);
                    })
            );
            // Reveal on calendar
            // TODO: replace activeLeaf() with recommended Workspace.getActiveViewOfType() method 
            if (window.app.workspace.activeLeaf?.getViewState()?.type === 'markdown') {
                menu.addItem((item) =>
                    item.setSection("open")
                        .setTitle("Reveal on calendar")
                        .setIcon("lucide-calendar")
                        .onClick(() => {
                            ViewManager.revealView();
                            console.log("Revealing on calendar", file);
                            activeFilepathStore.set(file.path);
                            displayedDateStore.set(date)
                        })
                )
            }

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
            extraItems?.add?.(menu)

            window.app.workspace.trigger("file-menu", menu, file, "custom-file-menu");
        }
    }
}
