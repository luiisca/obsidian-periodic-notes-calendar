import { Plugin, WorkspaceLeaf, WorkspaceRoot } from 'obsidian';
import { CalendarView, VIEW_TYPE_CALENDAR } from './view';
import View from './View.svelte';
import { pluginClassStore, settingsStore } from './stores';
import { SettingsTab, type ISettings, DEFAULT_SETTINGS } from './settings';
import { CALENDAR_POPOVER_ID, granularities } from './constants';
import { tryToCreateNote } from './calendar-io';
import { getPeriodicityFromGranularity } from './calendar-io/parse';
import type { IPeriodicites } from './calendar-io/types';
import { createNldatePickerDialog } from './calendar-ui/modals/nldate-picker';
import { popoversStore, setupPopover, togglePopover } from './popover';
import { get } from 'svelte/store';
import type { SvelteComponent } from 'svelte';
import { popoverOnWindowEvent } from './utils';

export default class DailyNoteFlexPlugin extends Plugin {
	public settings: ISettings;
	popovers: Record<string, SvelteComponent | null> = {};
	popoversCleanups: (() => void)[] = [];
	popoverAutoUpdateCleanup: () => void;

	onunload() {
		console.log('ON Unload ⛰️');

		this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).forEach((leaf) => leaf.detach());

		this.popoversCleanups.length > 0 && this.popoversCleanups.forEach((cleanup) => cleanup());
		this.removeLocaleScripts();

		window.plugin = null;
	}

	async onload() {
		console.log('ON Load 🫵');
		window.plugin = this; // access plugin methods globally

		pluginClassStore.set(this);
		this.register(
			settingsStore.subscribe((settings) => {
				this.settings = settings;
			})
		);

		this.addSettingTab(new SettingsTab(this.app, this));
		await this.loadSettings();

		this.handleRibbon();

		// register view
		this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf));

		// Commands
		this.addCommand({
			id: 'open-calendar-view',
			name: 'Open calendar view',
			callback: () => {
				this.toggleView();
			}
		});

		granularities.forEach((granularity) => {
			(['previous', 'next'] as const).forEach((pos) => {
				const periodicity = getPeriodicityFromGranularity(granularity) as Exclude<
					IPeriodicites,
					'daily'
				>;

				let posText:
					| `${typeof pos}-${Exclude<typeof periodicity, 'daily'>}`
					| 'tomorrow'
					| 'yesterday';

				if (granularity === 'day') {
					posText = pos === 'next' ? 'tomorrow' : 'yesterday';
				} else {
					posText = `${pos}-${periodicity}`;
				}

				this.addCommand({
					id: `create-${posText}-note`,
					name: `Open ${
						granularity === 'day'
							? `${posText}'s`
							: `${pos} ${getPeriodicityFromGranularity(granularity)}`
					} note`,
					callback: () => {
						const { workspace } = window.app;
						const leaf = workspace.getUnpinnedLeaf();
						const date = window
							.moment()
							.clone()
							[pos === 'next' ? 'add' : 'subtract'](1, granularity)
							.startOf(granularity);

						tryToCreateNote({ leaf, date, granularity, confirmBeforeCreateOverride: false });
					}
				});
			});
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const nldatesPlugin = (<any>window.app).plugins.getPlugin('nldates-obsidian');
		if (nldatesPlugin) {
			this.addCommand({
				id: 'open-nldate-note',
				name: 'Open a Periodic Note based on Natural Language Date selection',
				callback: () => {
					createNldatePickerDialog(this);
				}
			});
		}
		// const parsedResult = nldatesPlugin.parseDate('next year');
		// console.log(parsedResult.moment.format('YYYY')); // This should return 2021

		this.app.workspace.onLayoutReady(() => {
			console.log('ON Layout REady 🙌');

			this.initView({ active: false });

			console.log('openPopoverOnRibbonHover: ', this.settings.openPopoverOnRibbonHover);
			if (this.settings.openPopoverOnRibbonHover) {
				console.log('about to setupPopover!');
					setupPopover({
						id: CALENDAR_POPOVER_ID,
						openOnReferenceElHover: true,
						view: {
							Component: View
						},
						onWindowEvent: popoverOnWindowEvent
					})
			}
		});
	}

	async loadSettings() {
		const settings = await this.loadData();
		console.log('main > loadSettings: settings from this.loadData()', settings);
		!settings && (await this.saveData(DEFAULT_SETTINGS));

		settingsStore.update((old) => ({
			...old,
			...(settings || {})
		}));
	}

	async saveSettings(changeSettings: (old: ISettings) => Partial<ISettings>) {
		settingsStore.update((old) => {
			console.log('INside saveSettings', changeSettings(old));
			return {
				...old,
				...changeSettings(old)
			};
		});

		await this.saveData(this.settings);
	}

	handleRibbon() {
		this.addRibbonIcon('dice', 'Open calendar', () => {
			if (this.settings.viewOpen) {
				this.toggleView();

				const popoverStore = get(popoversStore)[CALENDAR_POPOVER_ID];
				if (this.settings.openPopoverOnRibbonHover && popoverStore?.opened) {
					togglePopover({ id: CALENDAR_POPOVER_ID });
				}

				return;
			} else {
				if (this.settings.openPopoverOnRibbonHover) {
					togglePopover({ id: CALENDAR_POPOVER_ID });

					return;
				} else {
					setupPopover({
						id: CALENDAR_POPOVER_ID,
						view: {
							Component: View
						},
						onWindowEvent: popoverOnWindowEvent
					});
					togglePopover({ id: CALENDAR_POPOVER_ID });

					return;
				}
			}
		}).id = `${CALENDAR_POPOVER_ID}-reference-el`;
	}

	async initView({ active }: { active: boolean } = { active: true }) {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);

		await this.app.workspace.getLeftLeaf(false).setViewState({
			type: VIEW_TYPE_CALENDAR,
			active
		});
	}
	revealView() {
		// get calendar view and set it as active
		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0]);
		this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0].setViewState({
			type: VIEW_TYPE_CALENDAR,
			active: true
		});
	}

	async toggleView() {
		/**
		 * HTMLElement where View is rendered at
		 */
		const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0] as
			| (WorkspaceLeaf & { containerEl: HTMLElement; tabHeaderEl: HTMLElement })
			| undefined;

		if (!leaf) {
			await this.initView();

			return;
		}

		const getSplitPos = () => {
			const closestWorkspaceSplitClassName =
				leaf.containerEl.closest('.workspace-split')?.className;

			if (closestWorkspaceSplitClassName?.includes('left')) {
				return 'left';
			}

			if (closestWorkspaceSplitClassName?.includes('right')) {
				return 'right';
			}

			return 'root';
		};

		/**
		 * The worskpace split where leaf is currently attached to
		 * based on closest workspace split className
		 */
		const crrSplitPos = getSplitPos();
		console.log('crrSplitPos', crrSplitPos);
		/**
		 * A split is a container for leaf nodes that slides in when clicking the collapse button, except for the root split (markdown editor). There are three types: left, root, and right.
		 */
		const crrSplit = this.app.workspace[`${crrSplitPos}Split`];
		console.log('crrSplit', crrSplit);

		const leafActive = leaf.tabHeaderEl.className.includes('is-active');
		console.log('leafActive', leafActive);

		// Scnearios
		// eval root split
		if (crrSplit instanceof WorkspaceRoot) {
			if (leafActive) {
				// 1. root split && leaf active
				leaf.view.unload();
				await this.initView({ active: false });

				return;
			}
			// 2. root split && leaf NOT active
			this.revealView();

			return;
		}

		// eval left or right split
		// only leftSplit and rightSplit can be collapsed
		if (!crrSplit.collapsed) {
			if (leafActive) {
				// 3. crr split open and leaf active
				crrSplit.collapse();
			} else {
				// 4. crr split open and leaf NOT active
				this.revealView();
			}
		} else {
			// 5. crr split collapsed
			this.revealView();
		}
	}

	removeLocaleScripts() {
		console.log('removing locales scripts 🎑');
		const existingScripts = document.querySelectorAll(
			'script[src^="https://cdn.jsdelivr.net/npm/dayjs@1"]'
		);
		console.log('exisiting scirpt to remove 🤯', existingScripts);
		existingScripts.forEach((script) => {
			script.remove();
		});
	}
}
