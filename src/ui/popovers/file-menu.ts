import { PluginService } from "@/app-service";
import { FILE_MENU_POPOVER_ID } from "@/constants";
import { TFileData, type IGranularity } from "@/io";

import { Menu, Platform } from "obsidian";
import { eventHandlers, isControlPressed } from "../utils";

export type TFileMenuPopoverParams = {
    id: typeof FILE_MENU_POPOVER_ID,
}
export type FileMenuOpenParams = {
    event: MouseEvent,
    fileData: TFileData,
    date: moment.Moment,
    granularity?: IGranularity,
    extraItems?: {
        add: (menu: Menu) => void,
        newSections: string[]
    },
}

export class FileMenuPopoverBehavior {
    private menu: Menu | null = null;
    public opened = false;

    constructor(params: TFileMenuPopoverParams) {
        // Do nothing
    }

    public toggle(param: FileMenuOpenParams) {
        if (this.opened) {
            this.close()
        } else {
            this.open(param)
        }
    }

    public open({ event, fileData, date, granularity, extraItems }: FileMenuOpenParams) {
        this.opened = true;

        this.menu = new Menu();

        if (fileData.file) {
            this.openCustomFileMenu(this.menu, fileData, date, granularity, extraItems)
        } else if (date && granularity) {
            this.menu.addItem((item) => {
                item
                    .setTitle("Create note")
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

    private openCustomFileMenu(menu: Menu, fileData: TFileData, date: moment.Moment, granularity?: IGranularity, extraItems?: FileMenuOpenParams['extraItems']) {
        const file = fileData.file;
        if (file) {
            // Add sections to the menu
            (menu as any).addSections([...(extraItems?.newSections || []), "title", "open", "action-primary", "action", "info", "view", "system", "", "danger"]);

            if (Platform.isPhone) {
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
                        PluginService.getPlugin()?.app.workspace.openLinkText(file.path, "", "tab");
                    })
            );

            // Open to the right
            menu.addItem((item) =>
                item.setSection("open")
                    .setTitle("Open to the right")
                    .setIcon("lucide-separator-vertical")
                    .onClick(() => {
                        PluginService.getPlugin()?.app.workspace.openLinkText(file.path, "", "split");
                    })
            );

            // Make a copy
            menu.addItem((item) =>
                item.setSection("action")
                    .setTitle("Make a copy")
                    .setIcon("lucide-files")
                    .onClick(() => {
                        const newPath = (PluginService.getPlugin()?.app.vault as any).getAvailablePath(file.path, file.extension);
                        PluginService.getPlugin()?.app.vault.copy(file, newPath).then((newFile) => {
                            PluginService.getPlugin()?.app.workspace.openLinkText(newFile.path, "", "tab");
                        });
                    })
            );

            // Delete
            menu.addItem((item) =>
                (item.setSection("danger")
                    .setTitle("Delete")
                    .setIcon("lucide-trash-2")
                    .onClick(() => {
                        (PluginService.getPlugin()?.app as any).fileManager.promptForFileDeletion(file);
                    }) as any)
                    .setWarning(true)
            );

            extraItems?.add?.(menu)

            PluginService.getPlugin()?.app.workspace.trigger("file-menu", menu, file, "custom-file-menu");
        }
    }
}
