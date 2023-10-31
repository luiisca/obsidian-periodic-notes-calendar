import { Plugin, WorkspaceLeaf, WorkspaceRoot } from 'obsidian';
import { computePosition, autoUpdate, flip, offset, shift, arrow } from '@floating-ui/dom';
import { CalendarView, VIEW_TYPE_CALENDAR } from './view';
import Calendar from './View.svelte';
import { pluginClassStore, settingsStore } from './stores';
import { SettingsTab, type ISettings, DEFAULT_SETTINGS } from './settings';
import { granularities } from './constants';
import { isMetaPressed } from './calendar-ui/utils';
import { tryToCreateNote } from './calendar-io';
import type { Moment } from 'moment';
import { getPeriodicityFromGranularity } from './calendar-io/parse';
import type { IPeriodicites } from './calendar-io/types';
import { createNldatePickerDialog } from './calendar-ui/modals/nldate-picker';

export default class DailyNoteFlexPlugin extends Plugin {
	public settings: ISettings;
	popupCalendar: Calendar;
	cleanupPopup: () => void;
	popupAutoUpdateCleanup: () => void;

	onunload() {
		console.log('ON Unload ⛰️');

		this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).forEach((leaf) => leaf.detach());

		this.cleanupPopup && this.cleanupPopup();
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
			// const localeWeekStartNum = window._bundledLocaleWeekSpec.dow;

			this.initView({ active: false });

			// TODO: add open popup on ribbon hover setting
			// this.handlePopup(); // only needed once TODO implemented
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

				return;
			} else {
				this.handlePopup({ ribbonClicked: true });
			}
		}).id = 'daily-note-flex-plugin-ribbon';
	}
	handlePopup({ ribbonClicked }: { ribbonClicked: boolean } = { ribbonClicked: false }) {
		// TODO: should check for open popuo on ribbon hover setting to add a onHover event listner
		if (this.settings.viewOpen) return;

		this.popupCalendar = new Calendar({
			target: document.body,
			props: { popup: true }
		});

		const referenceEl = document.querySelector(
			`[id="daily-note-flex-plugin-ribbon"]`
		) as HTMLElement;
		const floatingEl = document.querySelector('[data-popup="true"]') as HTMLElement;
		const arrowEl = document.createElement('div') as HTMLElement;
		const opened = (floatingEl.dataset.opened as string) === 'true' ? true : false;

		const render = () => {
			computePosition(referenceEl, floatingEl, {
				placement: 'right',
				middleware: [offset(16), shift({ padding: 8 }), flip(), arrow({ element: arrowEl })]
			}).then(({ x, y, placement, middlewareData }) => {
				Object.assign(floatingEl.style, {
					left: `${x}px`,
					top: `${y}px`
				});
				// Handle Arrow Placement:
				// https://floating-ui.com/docs/arrow
				if (arrowEl && middlewareData.arrow) {
					const { x: arrowX, y: arrowY } = middlewareData.arrow;

					const staticSide = {
						top: 'bottom',
						right: 'left',
						bottom: 'top',
						left: 'right'
					}[placement.split('-')[0]];

					staticSide &&
						Object.assign(arrowEl.style, {
							left: arrowX != null ? `${arrowX}px` : '',
							top: arrowY != null ? `${arrowY}px` : '',
							right: '',
							bottom: '',
							[staticSide]: '-4px'
						});
				}
			});
		};

		this.cleanupPopup = () => {
			this.popupAutoUpdateCleanup = () => ({});

			window.removeEventListener('click', onWindowClick);
			window.removeEventListener('keydown', onWindowKeyDown);

			this.popupCalendar && this.popupCalendar.$destroy();
		};

		// State Handlers
		const open = () => {
			render();
			floatingEl.dataset.opened = 'true';

			floatingEl.style.display = 'block';
			floatingEl.style.opacity = '1';
			floatingEl.style.pointerEvents = 'auto';
			// enable popup interactions
			floatingEl.removeAttribute('inert');

			// Trigger Floating UI autoUpdate (open only)
			// https://floating-ui.com/docs/autoUpdate
			this.popupAutoUpdateCleanup = autoUpdate(referenceEl, floatingEl, render);
		};
		const close = () => {
			floatingEl.dataset.opened = 'false';

			floatingEl.style.opacity = '0';
			// disable popup interactions
			floatingEl.setAttribute('inert', '');

			// Cleanup Floating UI autoUpdate
			this.popupAutoUpdateCleanup();
		};
		function toggle() {
			opened ? close() : open();
		}

		// Event Handlers
		function onWindowClick(event: MouseEvent) {
			const ev = event as MouseEvent & { target: Node | null };
			const floatingEl = document.querySelector('[data-popup="true"]') as HTMLElement;
			const opened = (floatingEl.dataset.opened as string) === 'true' ? true : false;

			if (!opened) return;

			if (referenceEl.contains(ev.target)) return;

			if (floatingEl && !floatingEl.contains(ev.target)) {
				close();
				// remove event listener when closing popup to avoid polluting the event stack
				window.removeEventListener('click', onWindowClick);

				return;
			}
		}

		// Accessibility Keyboard Interactions
		const onWindowKeyDown = (event: KeyboardEvent) => {
			const floatingEl = document.querySelector('[data-popup="true"]') as HTMLElement;
			const opened = (floatingEl.dataset.opened as string) === 'true' ? true : false;

			if (!opened) return;

			const focusableAllowedList =
				':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';

			const focusablePopupElements: HTMLElement[] = Array.from(
				floatingEl?.querySelectorAll(focusableAllowedList)
			);

			if (event.key === 'Escape') {
				event.preventDefault();
				referenceEl.focus();
				close();
				// remove event listener when closing popup to avoid polluting the event stack
				window.removeEventListener('keydown', onWindowKeyDown);

				return;
			}

			const referenceElFocused: boolean = opened && document.activeElement === referenceEl;
			// When the user focuses on 'referenceEl' and then presses the Tab or ArrowDown key, the first element inside the view should receive focus.
			if (
				referenceElFocused &&
				(event.key === 'ArrowDown' || event.key === 'Tab') &&
				focusablePopupElements.length > 0
			) {
				event.preventDefault();
				focusablePopupElements[0].focus();
			}
		};

		// Event Listeners
		window.addEventListener('click', onWindowClick);
		window.addEventListener('keydown', onWindowKeyDown);

		// ribbon clicked || autoStart calendar setting
		if (ribbonClicked) {
			toggle();
		}
		// autoStart calendar setting
		// add onHOver eventlistener
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
