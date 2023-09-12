import { ItemView, WorkspaceLeaf } from "obsidian";

import Component from "./ui/Component.svelte";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class ExampleView extends ItemView {
  component: Component;

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
    console.log('VIEW EL 🪟', this.contentEl)
    this.component = new Component({
      target: this.contentEl,
      props: {
        variable: 1,
      }
    });
    console.log("On open view👐")
  }

  async onClose() {
    console.log('On close view❌')
    this.component.$destroy();
    
  }
}