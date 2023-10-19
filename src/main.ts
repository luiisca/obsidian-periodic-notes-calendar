import { Plugin, WorkspaceLeaf } from 'obsidian';
import { computePosition, autoUpdate, flip, offset, shift, arrow } from '@floating-ui/dom';
import { CalendarView, VIEW_TYPE_CALENDAR } from './view';
import Calendar from './View.svelte';
import { settingsStore } from './stores';
import { SettingsTab, type ISettings, DEFAULT_SETTINGS } from './settings';
import { granularities } from './constants';
import { isMetaPressed } from './calendar-ui/utils';
import { tryToCreateNote } from './calendar-io';
import type { Moment } from 'moment';
import { getPeriodicityFromGranularity } from './calendar-io/parse';
import type { IPeriodicites } from './calendar-io/types';

export default class DailyNoteFlexPlugin extends Plugin {
	public settings: ISettings;
	popupCalendar: Calendar;
	cleanupPopup: () => void;

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

		this.register(
			settingsStore.subscribe((settings) => {
				this.settings = settings;
			})
		);

		this.addSettingTab(new SettingsTab(this.app, this));
		await this.loadSettings();

		this.handleRibbon();

		this.handleView();

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

		this.app.workspace.onLayoutReady(() => {
			console.log('ON Layout REady 🙌');
			// const localeWeekStartNum = window._bundledLocaleWeekSpec.dow;

			this.handlePopup();
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
		this.addRibbonIcon('dice', 'daily-note-flex-plugin', () => {
			if (this.settings.viewOpen) {
				this.toggleView();
				console.log('localeWeekStartNum 📅', window._bundledLocaleWeekSpec);

				return;
			}
		});
	}
	handlePopup() {
		console.log('HANDLE popup called 🍿');

		console.log('HandlePopup(): ViewOPen', this.settings.viewOpen);
		if (this.settings.viewOpen) return;
		// Local State
		let popupState: { open: boolean; autoUpdateCleanup: () => void } = {
			open: false,
			autoUpdateCleanup: () => ({})
		};
		const options = {
			target: 'calendarPopup'
		};
		const focusableAllowedList =
			':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';
		let focusablePopupElements: HTMLElement[];

		// Elements
		const referenceEl = document.querySelector(
			`[aria-label="daily-note-flex-plugin"]`
		) as HTMLElement;
		console.log('REFERENCEEl', referenceEl);
		console.log('POPUPCOMPONENT', this.popupCalendar);
		this.popupCalendar = new Calendar({
			target: document.body,
			props: { popup: true }
		});

		const floatingEl = document.querySelector(`[data-popup="${options.target}"]`) as HTMLElement;
		console.log('FLOATINGEL', floatingEl);
		const arrowEl = document.createElement('div') as HTMLElement;

		// State Handlers
		function open() {
			// Set open state to on
			popupState.open = true;
			// Update render settings
			render();
			// Update the DOM
			floatingEl.style.display = 'block';
			floatingEl.style.opacity = '1';
			floatingEl.style.pointerEvents = 'auto';
			// enable popup interactions
			floatingEl.removeAttribute('inert');
			// Trigger Floating UI autoUpdate (open only)
			// https://floating-ui.com/docs/autoUpdate
			popupState.autoUpdateCleanup = autoUpdate(referenceEl, floatingEl, render);
		}
		function close() {
			// Set open state to off
			popupState.open = false;
			// Update the DOM
			floatingEl.style.opacity = '0';
			// disable popup interactions
			floatingEl.setAttribute('inert', '');
			// Cleanup Floating UI autoUpdate (close only)
			if (popupState.autoUpdateCleanup) popupState.autoUpdateCleanup();
		}

		// Event Handlers
		function toggle() {
			console.log('ON ribbon click 🐭');
			popupState.open ? close() : open();
		}
		function onWindowClick(event: { target: Node | null }) {
			console.log('ON window click 🪟', event);
			// console.log("FloatingEL", floatingEl)
			// console.log("Event target", event.target)
			// Return if the popup is not yet open
			if (!popupState.open) return;
			// Return if reference element is clicked
			if (referenceEl.contains(event.target)) return;
			// If click outside the popup
			if (floatingEl && floatingEl.contains(event.target) === false) {
				close();
				return;
			}
		}

		// Keyboard Interactions for A11y
		const onWindowKeyDown = (event: KeyboardEvent) => {
			if (!popupState.open) return;
			// Handle keys
			const key: string = event.key;
			// On Esc key
			if (key === 'Escape') {
				event.preventDefault();
				referenceEl.focus();
				close();
				return;
			}
			// Update focusable elements (important for Autocomplete)
			focusablePopupElements = Array.from(floatingEl?.querySelectorAll(focusableAllowedList));
			// On Tab or ArrowDown key
			const triggerMenuFocused: boolean = popupState.open && document.activeElement === referenceEl;
			if (
				triggerMenuFocused &&
				(key === 'ArrowDown' || key === 'Tab') &&
				focusableAllowedList.length > 0 &&
				focusablePopupElements.length > 0
			) {
				event.preventDefault();
				focusablePopupElements[0].focus();
			}
		};

		// Event Listeners
		referenceEl.addEventListener('click', toggle);
		window.addEventListener('click', onWindowClick);
		window.addEventListener('keydown', onWindowKeyDown);

		// Render Floating UI Popup
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

		// Render popup
		render();

		this.cleanupPopup = () => {
			popupState = {
				open: false,
				autoUpdateCleanup: () => ({})
			};

			// Remove Event Listeners
			referenceEl.removeEventListener('click', toggle);
			window.removeEventListener('click', onWindowClick);
			window.removeEventListener('keydown', onWindowKeyDown);

			this.popupCalendar && this.popupCalendar.$destroy();
		};
	}

	async handleView() {
		// register view
		this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf));

		// TODO: Try to not block initial loading by deferring loading with 'onLayoutReady'
		// activate view
		await this.initView();
	}
	async initView({ active }: { active: boolean } = { active: true }) {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_CALENDAR);

		await this.app.workspace.getLeftLeaf(false).setViewState({
			type: VIEW_TYPE_CALENDAR,
			active
		});
	}
	revealView() {
		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0]);
		this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0].setViewState({
			type: VIEW_TYPE_CALENDAR,
			active: true
		});
	}

	async toggleView() {
		const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0] as
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
