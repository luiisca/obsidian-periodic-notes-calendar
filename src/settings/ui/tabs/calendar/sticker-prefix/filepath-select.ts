import { FuzzyMatch, FuzzySuggestModal, Notice, TAbstractFile, TFile } from 'obsidian';
import { mount } from "svelte";

import { ModalManager } from '@/ui/modals/modals-manager';
import { genNoticeFragment } from '@/ui/utils';
import Suggestion from "./Suggestion.svelte";
import TopBar from "./TopBar.svelte";

export class FilepathModal extends FuzzySuggestModal<string> {
  private filePaths: string[];
  private topBarContainer: HTMLElement | null = null;

  constructor(filePaths: string[]) {
    super(window.app);
    ModalManager.register(this);

    this.filePaths = filePaths;

    // Set modal properties
    this.setPlaceholder("Type to search files...");
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "↵", purpose: "to use" },
      { command: "esc", purpose: "to dismiss" },
    ]);
  }

  getItems(): string[] {
    if (this.filePaths.length === 0) {
      this.topBarContainer?.remove();
    }
    return this.filePaths;
  }

  getItemText(filePath: string): string {
    // Return the full path for fuzzy searching
    return filePath;
  }

  renderSuggestion(result: FuzzyMatch<string>, el: HTMLElement) {
    const filepath = result.item;

    mount(Suggestion, {
      target: el,
      props: {
        filepath,
      }
    })
  }

  onChooseItem(filePath: string) {
    // Close all modals
    ModalManager.closeAll();

    // close settings tab
    if (window.app?.setting && window.app?.setting?.activeTab) {
      window.app.setting.close?.();
    }

    const file = this.app.vault.getAbstractFileByPath(filePath);
    const isFileValid = this.isFileValid(filePath, file)

    if (isFileValid && file instanceof TFile) {
      // Open the file in the current leaf (tab)
      this.app.workspace.getLeaf().openFile(file).catch(console.error);

      // Get the file explorer view
      const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0]?.view;
      if (fileExplorer && 'revealInFolder' in fileExplorer) {
        // Reveal and focus the file in the explorer
        fileExplorer.revealInFolder(file);
      }
    }
  }

  onOpen() {
    void super.onOpen();
    const modalEl = this.modalEl;
    const inputContainer = modalEl.querySelector('.prompt-input-container');

    this.topBarContainer = createDiv();
    mount(TopBar, {
      target: this.topBarContainer,
    })

    inputContainer?.insertAdjacentElement('afterend', this.topBarContainer);
  }

  private isFileValid(filepath: string, file: TAbstractFile | null) {
    if (!file) {
      new Notice(genNoticeFragment([
        ['Error: File '],
        [filepath, 'u-pop'],
        [' not found'],
      ]))
      return false;
    }

    if (!(file instanceof TFile)) {
      console.warn(`Not a file: ${filepath}`);
      return false
    }

    return true;
  }
}
