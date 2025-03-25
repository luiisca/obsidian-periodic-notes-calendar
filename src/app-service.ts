import { App, Plugin } from "obsidian";

type TPlugin = Plugin & { app: App }
export class PluginService {
    private static instance: TPlugin | null

    static init(plugin: Plugin) {
        this.instance = plugin as TPlugin
    }

    static getPlugin() {
        return this.instance
    }
}
