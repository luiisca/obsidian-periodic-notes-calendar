import { PluginService } from '@/app-service';
import { FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import { ModalManager } from './modals-manager';

export class FolderpathsModal extends FuzzySuggestModal<string> {
    private folderpaths: string[];
    private moveAll: (folderpath: string, modal: FolderpathsModal) => void

    constructor(moveAll: (folderpath: string, modal: FolderpathsModal) => void) {
        const app = PluginService.getPlugin()?.app
        if (!app) return;

        super(app);
        ModalManager.register(this);

        this.folderpaths = ['/', ...app.vault.getAllFolders().map(folder => folder.path)];
        this.moveAll = moveAll

        // Set modal properties
        this.setPlaceholder("Type to search files...");
        this.setInstructions([
            { command: "↑↓", purpose: "to navigate" },
            { command: "↵", purpose: "to use" },
            { command: "esc", purpose: "to dismiss" },
        ]);
    }

    getItems(): string[] {
        return this.folderpaths;
    }
    getItemText(folderpath: string): string {
        return folderpath;
    }

    selectSuggestion(folderpath: FuzzyMatch<string>, evt: MouseEvent | KeyboardEvent): void {
        evt.preventDefault();
        this.moveAll(folderpath.item, this)
    }

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
    }
}
