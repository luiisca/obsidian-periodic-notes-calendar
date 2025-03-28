import {
    switchLocale,
} from '@/stores';
import { FuzzySuggestModal } from 'obsidian';
import { ModalManager } from './modals-manager';
import { PluginService } from '@/app-service';

export interface ILocaleItem {
    momentLocale: string;
    label: string
}

export class LocalesPickerModal extends FuzzySuggestModal<ILocaleItem> {
    private locales: ILocaleItem[];

    constructor(locales: ILocaleItem[]) {
        const app = PluginService.getPlugin()?.app
        if (!app) return;

        super(app);
        ModalManager.register(this);

        this.locales = locales;

        // Set modal properties
        this.setPlaceholder("Type to search locales...");
        this.setInstructions([
            { command: "↑↓", purpose: "to navigate" },
            { command: "↵", purpose: "to use" },
            { command: "esc", purpose: "to dismiss" },
        ]);
    }

    getItems(): ILocaleItem[] {
        return this.locales;
    }

    getItemText(item: ILocaleItem): string {
        return item.label;
    }

    onChooseItem(item: ILocaleItem): void {
        ModalManager.closeAll();

        switchLocale(item.momentLocale);
        this.close();
    }
}

export function createLocalesPickerDialog(locales: ILocaleItem[]) {
    new LocalesPickerModal(locales).open();
}
