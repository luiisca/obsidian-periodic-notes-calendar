import { PluginService } from "@/app-service";
import { TFileData, type IGranularity } from "@/io";

import { Menu, Platform } from "obsidian";
import { eventHandlers, isControlPressed } from "../utils";

// export type TFileMenuPopoverParams = {
// }
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

  constructor() {
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
            }).catch(console.error);
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
      (menu as Menu & { addSections: (sections: string[]) => void }).addSections([...(extraItems?.newSections || []), "title", "open", "action-primary", "action", "info", "view", "system", "", "danger"]);

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
            PluginService.getPlugin()?.app.workspace.openLinkText(file.path, "", "tab").catch(console.error);
          })
      );

      // Open to the right
      menu.addItem((item) =>
        item.setSection("open")
          .setTitle("Open to the right")
          .setIcon("lucide-separator-vertical")
          .onClick(() => {
            PluginService.getPlugin()?.app.workspace.openLinkText(file.path, "", "split").catch(console.error);
          })
      );

      // Make a copy
      menu.addItem((item) =>
        item.setSection("action")
          .setTitle("Make a copy")
          .setIcon("lucide-files")
          .onClick(() => {
            const plugin = PluginService.getPlugin()
            if (!plugin) return;

            const newPath = plugin.app.vault.getAvailablePath(file.path, file.extension);
            plugin.app.vault.copy(file, newPath).then((newFile) => {
              plugin.app.workspace.openLinkText(newFile.path, "", "tab").catch(console.error);
            }).catch(console.error);
          })
      );

      // Delete
      menu.addItem((item) =>
        item.setSection("danger")
          .setTitle("Delete")
          .setIcon("lucide-trash-2")
          .setWarning(true)
          .onClick(() => {
            const plugin = PluginService.getPlugin();
            if (plugin) {
              plugin.app.fileManager.promptForDeletion(file).catch(console.error);
            }
          })
      );

      extraItems?.add?.(menu)

      PluginService.getPlugin()?.app.workspace.trigger("file-menu", menu, file, "custom-file-menu");
    }
  }
}
