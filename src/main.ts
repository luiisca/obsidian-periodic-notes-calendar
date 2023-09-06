import {
	App,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
	WorkspaceSidedock
} from 'obsidian';
import { ExampleView, VIEW_TYPE_EXAMPLE } from './view';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings = DEFAULT_SETTINGS;
	private view: ExampleView;

	onunload(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE).forEach((leaf) => leaf.detach());
	}

	async onload() {
		await this.loadSettings();

		this.handleRibbon();

		await this.handleView();

		this.addCommand({
			id: 'open-calendar-view',
			name: 'Open calendar view',
			callback: () => {
				this.toggleView();
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	handleRibbon() {
		this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			this.toggleView();
		});
	}

	async handleView() {
		// register view
		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => (this.view = new ExampleView(leaf)));

		// activate view
		await this.initView();
	}
	async initView({ active }: { active: boolean } = { active: true }) {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);

		await this.app.workspace.getLeftLeaf(false).setViewState({
			type: VIEW_TYPE_EXAMPLE,
			active
		});
	}
	revealView() {
		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]);
		this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0].setViewState({
			type: VIEW_TYPE_EXAMPLE,
			active: true
		});
	}

	async toggleView() {
		const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0] as
			| WorkspaceLeaf
			| undefined;

		if (!leaf) {
			await this.initView();
			this.revealView();

			return;
		}

		const ACTIVE_CLASSNAME = 'is-active';
		const WORKSPACE_SPLIT_CLASSNAME = '.workspace-split';

		// @ts-ignore
		const closestWorkspaceSplitClassName = leaf.containerEl.closest(WORKSPACE_SPLIT_CLASSNAME)
			.className as string;
		const leafSplit = (closestWorkspaceSplitClassName.match('right')?.[0] ||
			closestWorkspaceSplitClassName.match('left')?.[0] ||
			'root') as 'right' | 'left' | 'root';

		// @ts-ignore
		const leafActive = leaf.tabHeaderEl.className.includes(ACTIVE_CLASSNAME);

		const leftSplit = this.app.workspace.leftSplit;
		const rightSplit = this.app.workspace.rightSplit;
		const leafSideDockOpen =
			leafSplit === 'left'
				? !leftSplit.collapsed
				: leafSplit === 'right'
				? !rightSplit.collapsed
				: false;

		// Scenarios
		if (leafSideDockOpen) {
			if (leafActive) {
				// 1. leaf sidedock open and leaf active -> close sidedock
				(leafSplit === 'left' && leftSplit.collapse()) ||
					(leafSplit === 'right' && rightSplit.collapse());

				return;
			}

			if (!leafActive) {
				// 2. leaf sidedock open and leaf not active -> reveal view
				this.revealView();

				return;
			}
		}

		if (!leafSideDockOpen) {
			if (leafSplit === 'root' && leafActive) {
				// 4. root split open and leaf active -> close root split
				leaf.detach();
				await this.initView({ active: false });

				return;
			}
			// 3. leaf sidedock close -> open leaf sidedock and reveal view
			// 5. root split open and leaf not active -> reveal view
			this.revealView();
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
