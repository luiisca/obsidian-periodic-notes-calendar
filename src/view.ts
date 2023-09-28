import { ItemView, WorkspaceLeaf } from "obsidian";

import View from "./View.svelte";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class CalendarView extends ItemView {
  view: View;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return "Example view";
  }

  async onOpen() {
    console.log("On open view👐")
    const context = new Map();
    context.set('view', this)

    this.view = new View({
      target: this.contentEl,
      context,
    });
  }

  async onClose() {
    console.log('On close view❌')
    this.view.$destroy();
  }
}