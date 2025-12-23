import { PluginService } from '@/app-service';
import { join } from '@/io';
import { PeriodSettings, settingsStore, TFormat } from '@/settings';
import { internalFileModStore } from '@/stores/notes';
import { FuzzyMatch, FuzzySuggestModal, normalizePath, Notice, TAbstractFile, TFile } from 'obsidian';
import { mount } from "svelte";
import { get, Writable } from 'svelte/store';
import { genNoticeFragment } from '../utils';
import MoveAllTitle from "./components/MoveAllTitle.svelte";
import MoveTitle from "./components/move-title.svelte";
import DeleteAllTitle from "./components/DeleteAllTitle.svelte";
import DeleteTitle from "./components/DeleteTitle.svelte";
import Suggestion from "./components/Suggestion.svelte";
import TopBar from "./components/TopBar.svelte";
import DeletedFilesCount from "./components/deleted-files-count.svelte";
import MovedFilesCount from "./components/moved-files-count.svelte";
import { createConfirmationDialog } from './confirmation';
import { FolderpathsModal } from './folder-select';
import { ModalManager } from './modals-manager';
import { deletedFilesCountStore, movedFilesCountStore } from "./stores";

export class FilepathModal extends FuzzySuggestModal<string> {
  private filePaths: string[];
  private format: TFormat;
  private topBarContainer: HTMLElement | null = null;
  private settingsStore: Writable<PeriodSettings>;

  constructor(filePaths: string[], settingsStore: Writable<PeriodSettings>, format: TFormat) {
    const app = PluginService.getPlugin()?.app
    if (!app) return;

    super(app);
    ModalManager.register(this);

    this.filePaths = filePaths;
    this.format = format;
    this.settingsStore = settingsStore;

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
        onMove: async () => {
          await this.handleMoveFile(filepath);
        },
        onDelete: async () => {
          await this.handleDeleteFile(filepath);
        },
        settingsStore: this.settingsStore,
        format: this.format,
      }
    })
  }

  async handleMoveFile(filepath: string) {
    const file = this.app.vault.getAbstractFileByPath(filepath);
    const isFileValid = this.isFileValid(filepath, file);
    if (!isFileValid || !file) return;

    const selectFolderpath = (targetFolderpath: string, folderpathsModal: FolderpathsModal) => {
      const move = async () => {
        folderpathsModal.close();
        try {
          const newPath = normalizePath(join(targetFolderpath, file.name));
          await this.app.vault.rename(file, newPath);

          this.filePaths.splice(this.filePaths.indexOf(filepath), 1, newPath);
          this.updateSuggestions();
          new Notice(genNoticeFragment([
            [filepath, 'u-pop'],
            [' moved to '],
            [targetFolderpath, 'u-pop'],
          ]))
        } catch (error) {
          new Notice(
            genNoticeFragment([
              [`Error moving ${filepath} to ${targetFolderpath}`],
              error instanceof Error ? [error.message, 'u-pop'] : null
            ]),
            4000
          );
        }
      }

      const shouldConfirmBeforeMoveFile = get(settingsStore).shouldConfirmBeforeMoveFile;
      if (shouldConfirmBeforeMoveFile) {
        createConfirmationDialog({
          title: {
            Component: MoveTitle,
            props: {
              filepath,
              targetFolderpath
            }
          },
          text: "",
          cta: "Move",
          onAccept: async (dontAskAgain) => {
            move().catch(console.error);
            if (dontAskAgain) {
              settingsStore.update((settings) => ({
                ...settings,
                shouldConfirmBeforeMoveFile: false
              }));
            }
          }
        });
      } else {
        move().catch(console.error);
      }
    }
    new FolderpathsModal(selectFolderpath).open();
  }

  async handleMoveAll() {
    const selectFolderpath = (targetFolderpath: string, folderpathsModal: FolderpathsModal) => {
      const moveAll = async () => {
        folderpathsModal.close();
        const fragment = document.createDocumentFragment();
        mount(MovedFilesCount, {
          target: fragment as unknown as Element,
          props: {
            filepathsLength: this.filePaths.length,
            targetFolderpath
          }
        })
        const notice = new Notice(fragment, 0)

        movedFilesCountStore.set(0);
        this.settingsStore.update(s => {
          s.formats[this.format.id].loading = true
          return s
        })
        const newFilepaths = [];
        for (const filepath of this.filePaths) {
          const file = this.app.vault.getAbstractFileByPath(filepath);
          const isFileValid = this.isFileValid(filepath, file);
          if (!isFileValid || !file) continue;

          try {
            const newPath = normalizePath(join(targetFolderpath, file.name));
            await this.app.vault.rename(file, newPath);
            newFilepaths.push(newPath);
            movedFilesCountStore.update((count) => count + 1);
          } catch (error) {
            new Notice(
              genNoticeFragment([
                [`Error moving ${filepath}`],
                error instanceof Error ? [error.message, 'u-pop'] : null
              ]),
              4000
            );
          }
        }
        this.settingsStore.update(s => {
          s.formats[this.format.id].loading = false
          return s
        })
        this.filePaths = newFilepaths;
        this.updateSuggestions();
        notice.hide()

        new Notice(`${get(movedFilesCountStore)} ${get(movedFilesCountStore) === 1 ? 'file' : 'files'} moved successfully`);
      }

      const shouldConfirmBeforeMoveAllFiles = get(settingsStore).shouldConfirmBeforeMoveAllFiles;
      if (shouldConfirmBeforeMoveAllFiles) {
        createConfirmationDialog({
          title: {
            Component: MoveAllTitle,
            props: {
              filepathsLength: this.filePaths.length,
              targetFolderpath
            }
          },
          text: "",
          cta: "Move all",
          onAccept: async (dontAskAgain) => {
            moveAll().catch(console.error);

            if (dontAskAgain) {
              settingsStore.update((settings) => ({
                ...settings,
                shouldConfirmBeforeMoveAllFiles: false
              }));
            }
          }
        });
      } else {
        moveAll().catch(console.error);
      }
    }
    new FolderpathsModal(selectFolderpath).open();
  }

  private async handleDeleteFile(filepath: string) {
    const file = this.app.vault.getAbstractFileByPath(filepath);
    const isFileValid = this.isFileValid(filepath, file);
    if (!isFileValid || !(file instanceof TFile)) return;

    const deleteFile = async () => {
      try {
        await this.deleteFile(file, filepath)

        this.filePaths = this.filePaths.filter(path => path !== filepath);
        this.updateSuggestions();
        new Notice(genNoticeFragment([
          [filepath, 'u-pop'],
          [' deleted'],
        ]))

      } catch (error) {
        new Notice(
          genNoticeFragment([
            ['Error deleting file'],
            error instanceof Error ? [error.message, 'u-pop'] : null
          ]),
          4000
        );
      }
    }

    const shouldConfirmBeforeDeleteFile = get(settingsStore).shouldConfirmBeforeDeleteFile;
    if (shouldConfirmBeforeDeleteFile) {
      createConfirmationDialog({
        title: {
          Component: DeleteTitle,
          props: {
            filepath
          }
        },
        text: "",
        cta: "Delete",
        onAccept: async (dontAskAgain) => {
          deleteFile().catch(console.error);
          if (dontAskAgain) {
            settingsStore.update((settings) => ({
              ...settings,
              shouldConfirmBeforeDeleteFile: false
            }));
          }
        }
      });
    } else {
      deleteFile().catch(console.error);;
    }
  }

  async handleDeleteAllFiles() {
    const deleteAllFiles = async () => {
      this.close();

      const fragment = document.createDocumentFragment();
      mount(DeletedFilesCount, {
        // @ts-ignore
        target: fragment,
        props: {
          filepathsLength: this.filePaths.length
        }
      })
      const notice = new Notice(fragment, 0)

      deletedFilesCountStore.set(0);
      this.settingsStore.update(s => {
        s.formats[this.format.id].loading = true
        return s
      })
      for (const filepath of this.filePaths) {
        const file = this.app.vault.getAbstractFileByPath(filepath);
        const isFileValid = this.isFileValid(filepath, file);
        if (!isFileValid || !(file instanceof TFile)) continue;

        try {
          await this.deleteFile(file, filepath);
          deletedFilesCountStore.update((count) => count + 1);
        } catch (error) {
          new Notice(
            genNoticeFragment([
              [`Error deleting ${filepath}`],
              error instanceof Error ? [error.message, 'u-pop'] : null
            ]),
            4000
          );
        }
      }
      this.settingsStore.update(s => {
        s.formats[this.format.id].loading = false
        return s
      })
      notice.hide()

      this.filePaths = [];
      new Notice(`${get(deletedFilesCountStore)} ${get(deletedFilesCountStore) === 1 ? 'file' : 'files'} deleted successfully`);
    }

    const shouldConfirmBeforeDeleteAllFiles = get(settingsStore).shouldConfirmBeforeDeleteAllFiles;
    if (shouldConfirmBeforeDeleteAllFiles) {
      createConfirmationDialog({
        title: {
          Component: DeleteAllTitle,
          props: {
            filepathsLength: this.filePaths.length
          }
        },
        text: "",
        cta: "Delete all",
        onAccept: async (dontAskAgain) => {
          deleteAllFiles().catch(console.error);

          if (dontAskAgain) {
            settingsStore.update((settings) => ({
              ...settings,
              shouldConfirmBeforeDeleteAllFiles: false
            }));
          }
        }
      });
    } else {
      deleteAllFiles().catch(console.error)
    }
  }

  onChooseItem(filePath: string) {
    // Close all modals
    ModalManager.closeAll();

    // close settings tab
    const app = PluginService.getPlugin()?.app
    if (app?.setting && app?.setting?.activeTab) {
      app.setting.close?.();
    }

    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      // Open the file in the current leaf (tab)
      this.app.workspace.getLeaf().openFile(file).catch(console.error);

      // Get the file explorer view
      const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0]?.view;
      if (fileExplorer) {
        // Reveal and focus the file in the explorer
        fileExplorer?.revealInFolder(file);
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
      props: {
        handleMoveAll: this.handleMoveAll.bind(this),
        handleDeleteAll: this.handleDeleteAllFiles.bind(this),
        settingsStore: this.settingsStore,
        format: this.format,
      },
    })

    inputContainer?.insertAdjacentElement('afterend', this.topBarContainer);
  }

  private async deleteFile(file: TFile, filePath: string) {
    internalFileModStore.set("deleted")

    await this.app.fileManager.trashFile(file);
    settingsStore.deleteFilepath(filePath, this.format.value);

    internalFileModStore.set(null)
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
