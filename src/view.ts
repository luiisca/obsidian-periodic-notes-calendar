import { ItemView, WorkspaceLeaf } from "obsidian";

import Calendar from "./ui/Calendar.svelte";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class CalendarView extends ItemView {
  calendar: Calendar;

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
    this.calendar = new Calendar({
      target: this.contentEl,
      props: {
      }
    });
    console.log("On open view👐")
  }

  async onClose() {
    console.log('On close view❌')
    this.calendar.$destroy();
    
  }
}