import { Plugin, WorkspaceLeaf, WorkspaceRoot } from 'obsidian';
import { CalendarView, VIEW_TYPE_CALENDAR } from './view';
import View from './View.svelte';
import {
	pluginClassStore,
	settingsStore,
	updateLocale,
	updateWeekStart,
	updateWeekdays
} from './stores';
import { SettingsTab, type ISettings, DEFAULT_SETTINGS } from './settings';
import { CALENDAR_POPOVER_ID, granularities } from './constants';
import { tryToCreateNote } from './calendar-io';
import { getPeriodicityFromGranularity } from './calendar-io/parse';
import type { IPeriodicites } from './calendar-io/types';
import { createNldatePickerDialog } from './calendar-ui/modals/nldate-picker';
import {
	closePopover,
	getFloatingEl,
	openPopover,
	popoversStore,
	setupPopover,
	togglePopover
} from './calendar-ui/popovers';
import { get } from 'svelte/store';
import type { SvelteComponent } from 'svelte';
import { ribbonReferenceElId } from './calendar-ui/popovers/calendar';
import locales from './locales';

export default class DailyNoteFlexPlugin extends Plugin {
	public settings: ISettings;
	popovers: Record<string, SvelteComponent | null> = {};
	popoversCleanups: (() => void)[] = [];
	popoverAutoUpdateCleanup: () => void;

	onunload() {
		console.log('ON Unload ⛰️');

		this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).forEach((leaf) => leaf.detach());

		this.popoversCleanups.length > 0 && this.popoversCleanups.forEach((cleanup) => cleanup());
	}

	async onload() {
		console.log('ON Load 🫵');

		pluginClassStore.set(this);

		this.register(
			settingsStore.subscribe((settings) => {
				this.settings = settings;
			})
		);

		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		this.handleRibbon();

		// register view
		this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf, this));

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
		// add quick locales switch commands
		if (this.settings.allowLocalesSwitchFromCommandPalette) {
			window.moment.locales().forEach((momentLocale) => {
				this.addCommand({
					id: `switch-to-${momentLocale}-locale`,
					name: `Switch to ${locales.get(momentLocale) || momentLocale} locale`,
					callback: () => {
						updateLocale(momentLocale);
						updateWeekStart();
						updateWeekdays();
					}
				});
			});
		}

		this.app.workspace.onLayoutReady(() => {
			console.log('ON Layout REady 🙌');

			this.initView({ active: false });

			if (this.settings.openPopoverOnRibbonHover) {
				setupPopover({
					id: CALENDAR_POPOVER_ID,
					view: {
						Component: View
					}
				});
			}
		});
	}

	async loadSettings() {
		const settings = (await this.loadData()) as ISettings;
		!settings && (await this.saveData(DEFAULT_SETTINGS));

		settingsStore.update((old) => ({
			...old,
			...(settings || {})
		}));
	}

	async saveSettings(changeSettings: (old: ISettings) => Partial<ISettings>) {
		settingsStore.update((old) => {
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
					closePopover({ id: CALENDAR_POPOVER_ID });
				}

				return;
			} else {
				if (this.settings.openPopoverOnRibbonHover) {
					togglePopover({ id: CALENDAR_POPOVER_ID });

					return;
				} else {
					const plugin = window.plugin as DailyNoteFlexPlugin;

					if (
						!getFloatingEl({ id: CALENDAR_POPOVER_ID }) &&
						!plugin.popovers[CALENDAR_POPOVER_ID]
					) {
						setupPopover({
							id: CALENDAR_POPOVER_ID,
							view: {
								Component: View
							}
						});
						openPopover({ id: CALENDAR_POPOVER_ID });
					} else {
						togglePopover({ id: CALENDAR_POPOVER_ID });
					}
				}
			}
		}).id = ribbonReferenceElId;
	}

	async initView({ active }: { active: boolean } = { active: true }) {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);

		await this.app.workspace[`get${get(settingsStore).viewLeafPosition}Leaf`](false).setViewState({
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

	// locale helpers
}
