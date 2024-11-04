import { FuzzyMatch, FuzzySuggestModal, Notice, TFile } from 'obsidian';
import Suggestion from "./components/Suggestion.svelte";
import TopBar from "./components/TopBar.svelte";
import { createConfirmationDialog } from './confirmation';
import { ModalManager } from './modals-manager';
import { genNoticeFragment } from '../utils';
import DeleteAllTitle from "./components/DeleteAllTitle.svelte"
import DeleteTitle from "./components/DeleteTitle.svelte"
import { settingsStore } from '@/settings';
import { get, writable, Writable } from 'svelte/store';
import { internalFileModStore } from '@/stores/notes';

export class FilepathModal extends FuzzySuggestModal<string> {
    private filePaths: string[];
    private formatValue: string;
    private topBarContainer: HTMLElement | null = null;
    private deletingAllStore: Writable<boolean> = writable(false);

    constructor(filePaths: string[], formatValue: string) {
        super(window.app);
        ModalManager.register(this);

        this.filePaths = filePaths;
        this.formatValue = formatValue;

        // Set modal properties
        this.setPlaceholder("Type to search files...");
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

        new Suggestion({
            target: el,
            props: {
                filepath,
                onDelete: async () => {
                    await this.handleDeleteFile(filepath);
                },
                deletingAllStore: this.deletingAllStore
            }
        })
    }

    private async handleDeleteFile(filePath: string) {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (!(file instanceof TFile)) {
            new Notice('Error: File not found');
            return;
        }
        const deleteFile = async () => {
            try {
                await this.deleteFile(file, filePath)

                this.filePaths = this.filePaths.filter(path => path !== filePath);
                // @ts-ignore
                this.updateSuggestions();
                new Notice(genNoticeFragment([
                    [file.name, 'u-pop'],
                    [' deleted'],
                ]))

            } catch (error) {
                new Notice(
                    genNoticeFragment([
                        ['Error deleting file'],
                        [error.message, 'u-pop']
                    ]),
                    8000
                );
            }
        }

        const shouldConfirmBeforeDeleteFile = get(settingsStore).shouldConfirmBeforeDeleteFile;
        if (shouldConfirmBeforeDeleteFile) {
            createConfirmationDialog({
                title: {
                    Component: DeleteTitle,
                    props: {
                        filename: file.name
                    }
                },
                text: "",
                cta: "Delete",
                onAccept: async (dontAskAgain) => {
                    deleteFile();
                    if (dontAskAgain) {
                        settingsStore.update((settings) => ({
                            ...settings,
                            shouldConfirmBeforeDeleteFile: false
                        }));
                    }
                }
            });
        } else {
            deleteFile();
        }
    }

    async handleDeleteAllFiles() {
        const deleteAllFiles = async () => {
            try {
                let deletedCount = 0;

                this.deletingAllStore.set(true);
                for (const filePath of this.filePaths) {
                    const file = this.app.vault.getAbstractFileByPath(filePath);
                    if (file instanceof TFile) {
                        await this.deleteFile(file, filePath);
                        deletedCount++;
                    }
                }
                this.deletingAllStore.set(false);

                this.filePaths = [];
                new Notice(`Deleted ${deletedCount} ${deletedCount === 1 ? 'file' : 'files'}`);
                this.close();
            } catch (error) {
                new Notice(
                    genNoticeFragment([
                        ['Error deleting files'],
                        [error.message, 'u-pop']
                    ]),
                    8000
                );
            }

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
                    deleteAllFiles();

                    if (dontAskAgain) {
                        settingsStore.update((settings) => ({
                            ...settings,
                            shouldConfirmBeforeDeleteAllFiles: false
                        }));
                    }
                }
            });
        } else {
            deleteAllFiles()
        }
    }

    async onChooseItem(filePath: string) {
        // Close all modals
        ModalManager.closeAll();

        // close settings tab
        if ((window.app as any).setting.activeTab) {
            (window.app as any).setting.close();
        }

        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile) {
            // Open the file in the current leaf (tab)
            await this.app.workspace.getLeaf().openFile(file);

            // Get the file explorer view
            const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0]?.view;
            if (fileExplorer) {
                // Reveal and focus the file in the explorer
                // @ts-ignore (the fileExplorer.reveal method exists but might not be in the type definitions)
                await fileExplorer.revealInFolder(file);
            }
        }
    }

    onOpen() {
        super.onOpen();
        const modalEl = this.modalEl;
        const inputContainer = modalEl.querySelector('.prompt-input-container');

        this.topBarContainer = createDiv();
        new TopBar({
            target: this.topBarContainer,
            props: {
                onDelete: this.handleDeleteAllFiles.bind(this),
                deletingAllStore: this.deletingAllStore,
            },
        })

        inputContainer?.insertAdjacentElement('afterend', this.topBarContainer);
    }

    private async deleteFile(file: TFile, filePath: string) {
        internalFileModStore.set("deleted")

        await this.app.vault.trash(file, true);
        settingsStore.deleteFilepath(filePath, this.formatValue);

        internalFileModStore.set(null)
    }
}
