import PeriodicNotesCalendarPlugin from "@/main";
import Settings from "@/settings/ui/Index.svelte";
import { setupLocale } from "@/stores";
import { App, Notice, PluginSettingTab } from 'obsidian';
import { SvelteComponent } from "svelte";
import { get } from "svelte/store";
import { settingsStore } from "./store";
import { granularities } from "@/constants";
import { getPeriodicityFromGranularity } from "@/io";
import { capitalize } from "@/utils";

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

        let errors = [];

        for (const granularity of granularities) {
            for (const format of get(settingsStore).notes[granularity].formats) {
                if (format.error.trim()) {
                    errors.push(capitalize(getPeriodicityFromGranularity(granularity)))
                    break;
                }
            }
        }

        // TODO: reword
        if (errors.length > 0) {
            const fragment = document.createDocumentFragment();

            const invalidText = document.createTextNode('Invalid settings for these periods: ');
            fragment.appendChild(invalidText);

            const errorSpan = document.createElement('span');
            errorSpan.className = 'u-pop';
            errorSpan.textContent = errors.join(', ');
            fragment.appendChild(errorSpan);

            const bewareText = document.createTextNode('. Beware that the calendar might not work correctly');
            fragment.appendChild(bewareText);

            new Notice(fragment, 5000);
        }
    }
}
