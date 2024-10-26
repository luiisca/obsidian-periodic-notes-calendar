import { FuzzyMatch, FuzzySuggestModal, TFile } from 'obsidian';
import { ModalManager } from './modals-manager';

export class FilepathModal extends FuzzySuggestModal<string> {
    private filePaths: string[];
    private styleEl: HTMLStyleElement;

    constructor(filePaths: string[]) {
        super(window.app);
        ModalManager.register(this);

        this.filePaths = filePaths;
        this.styleEl = document.createElement('style');

        // Set modal properties
        this.setPlaceholder("Type to search files...");
    }

    getItems(): string[] {
        return this.filePaths;
    }

    getItemText(filePath: string): string {
        // Return the full path for fuzzy searching
        return filePath;
    }

    renderSuggestion(result: FuzzyMatch<string>, el: HTMLElement) {
        // Get the actual file path from the match object
        const filePath = result.item;

        // Create a container for better styling
        const container = el.createDiv({
            cls: "file-path-suggestion"
        });

        // Add the file name in bold
        const fileName = filePath.split("/").pop() || "";
        container.createEl("span", {
            text: fileName,
            cls: "file-name"
        });

        // Add the path in a muted color
        if (filePath.includes("/")) {
            const path = filePath.substring(0, filePath.lastIndexOf("/"));
            container.createEl("span", {
                text: ` in ${path}`,
                cls: "file-path"
            });
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

        // Add custom styles
        const modalEl = this.modalEl;
        modalEl.addClass("file-path-modal");

        this.styleEl.textContent = `
            .file-path-modal .file-path-suggestion {
                padding: 4px 0;
                display: flex;
                align-items: flex-end;
            }
            
            .file-path-modal .file-name {
                font-weight: 500;
            }
            
            .file-path-modal .file-path {
                opacity: 0.7;
                font-size: 0.9em;
                height: 16px;
                margin-left: 4px;
            }
        `;
        document.head.appendChild(this.styleEl);
    }

    onClose() {
        super.onClose();
        // Clean up styles
        this.styleEl.remove();
    }
}
