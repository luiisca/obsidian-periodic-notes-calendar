import PeriodicNotesCalendarPlugin from "@/main";
import Settings from "@/settings/ui/Index.svelte";
import { setupLocale } from "@/stores";
import { App, PluginSettingTab } from 'obsidian';
import { SvelteComponent } from "svelte";

export class SettingsTab extends PluginSettingTab {
    public plugin: PeriodicNotesCalendarPlugin;
    private view: SvelteComponent | null = null;

    constructor(app: App, plugin: PeriodicNotesCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;

        setupLocale();
    }

    display() {
        this.containerEl.empty();

        this.view = new Settings({
            target: this.containerEl
        })
    }
    hide() {
        super.hide()
        this.view?.$destroy()
    }
}
