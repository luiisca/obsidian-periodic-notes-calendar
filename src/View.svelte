<script lang="ts">
	import { Notice, type App, Menu } from 'obsidian';
	import clsx from 'clsx';
	import { onDestroy, setContext } from 'svelte';
	import Calendar from './calendar-ui/components/Calendar.svelte';
	import {
		crrFileMenu,
		displayedDateStore,
		notesStores,
		rerenderStore,
		settingsStore
	} from './stores';
	import type { Moment } from 'moment';
	import {
		tryToCreateNote,
		type IGranularity,
		getNoteByGranularity,
		getDateUID
	} from './calendar-io';
	import { VIEW } from './calendar-ui/context';
	import { getNoteSettingsByGranularity } from './calendar-io/settings';
	import {
		openPopover,
		popoversStore,
		setupPopover,
		togglePopover,
		type IPopoverState,
		closePopover,
		getFloatingEl,
		positionFloatingEl
	} from './popover';
	import { get } from 'svelte/store';
	import StickerPopoverComponent from './calendar-ui/components/StickerPopover.svelte';
	import { CALENDAR_POPOVER_ID, STICKER_POPOVER_ID } from './constants';
	import { popoverOnWindowEvent } from './utils';
	import type DailyNoteFlexPlugin from './main';

	export let popover: boolean = false;

	export function rerenderCalendar() {
		rerenderStore.update((val) => ({
			...val,
			rerender: true
		}));
	}

	let today: Moment = window.moment();

	let heartbeat = setInterval(() => {
		// update today
		today = window.moment();

		// update displayedDateStore to new current date only if new current date is one day ahead.
		// useful to update display with new current month, year or years range automatically
		if (today.isSame($displayedDateStore.clone().add(1, 'day'))) {
			console.log('⚙⚙⚙ RERENDERING CALENdAR ⚙⚙⚙️');

			displayedDateStore.set(today);
			rerenderCalendar();
		}
	}, 1000 * 60);

	type TOnClick = ({
		date,
		isNewSplit,
		granularity
	}: {
		date: Moment;
		isNewSplit: boolean;
		granularity: IGranularity;
	}) => Promise<void>;
	type TOnHover = ({
		date,
		targetEl,
		isMetaPressed,
		granularity
	}: {
		date: Moment;
		targetEl: EventTarget | null;
		isMetaPressed: boolean;
		granularity: IGranularity;
	}) => void;
	type TOnContextMenu = ({
		date,
		event,
		granularity
	}: {
		date: Moment;
		event: MouseEvent;
		granularity: IGranularity;
	}) => void;

	interface ICalendarViewCtx {
		app: App;
		eventHandlers: {
			onClick: TOnClick;
			onHover: TOnHover;
			onContextMenu: TOnContextMenu;
		};
	}

	// Component event handlers
	const onClick = async ({
		date,
		isNewSplit,
		granularity
	}: Parameters<TOnClick>[0]): Promise<void> => {
		const { workspace } = window.app;
		const leaf = isNewSplit ? workspace.splitActiveLeaf() : workspace.getUnpinnedLeaf();

		tryToCreateNote({ leaf, date, granularity });
	};

	const onHover = ({
		date,
		targetEl,
		isMetaPressed,
		granularity
	}: Parameters<TOnHover>[0]): void => {
		const { format } = getNoteSettingsByGranularity(granularity);
		const note = getNoteByGranularity({ date, granularity });

		if (isMetaPressed || $settingsStore.autoHoverPreview) {
			window.app.workspace.trigger('link-hover', targetEl, date.format(format), note?.path);
		}
	};

	const onContextMenu = ({ date, event, granularity }: Parameters<TOnContextMenu>[0]): void => {
		const note = getNoteByGranularity({ date, granularity });

		if (!note) {
			// TODO: improve wording
			new Notice('Create a note first');
		} else {
			const dateUID = getDateUID(date, granularity);
			const referenceEl = event.target as HTMLElement;

			const calendarPopoverStore = get(popoversStore)[CALENDAR_POPOVER_ID];

			const setupStickerPopover = () => {
				const plugin = window.plugin as DailyNoteFlexPlugin;
				const floatingEl = getFloatingEl({ id: STICKER_POPOVER_ID });

				console.log('setupStickerPopover() > floatingEl: ', floatingEl);

				if (!floatingEl && !plugin.popovers[STICKER_POPOVER_ID]) {
					console.log('😥 sticker popover does not exist. Creating...'.toUpperCase());
					setupPopover({
						id: STICKER_POPOVER_ID,
						referenceEl,
						view: {
							Component: StickerPopoverComponent,
							props: {
								noteStore: notesStores[granularity],
								noteDateUID: dateUID
							}
						},
						addListeners: false
					});
				} else {
					console.log('🎉 sticker popover does exist. Recalculating position...'.toUpperCase());
					// positionFloatingEl({
					// 	referenceEl,
					// 	id: STICKER_POPOVER_ID,
					// 	customX: event.pageX,
					// 	customY: event.pageY
					// });
				}

				console.log('openStickerPOpover(): 🤌');
				console.log('customX: ', event.pageX);
				console.log('customY: ', event.pageY);

				openPopover({
					referenceEl,
					id: STICKER_POPOVER_ID,
					customX: event.pageX,
					customY: event.pageY
				});
			};

			(function setupFileMenu() {
				const fileMenu = new Menu();
				crrFileMenu.set(fileMenu);

				fileMenu.addItem((item) =>
					item.setTitle('Add Sticker').setIcon('smile-plus').onClick(setupStickerPopover)
				);
				fileMenu.addItem((item) =>
					item
						.setTitle('Delete')
						.setIcon('trash')
						.onClick(() => {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							(<any>app).fileManager.promptForFileDeletion(note);
						})
				);

				app.workspace.trigger('file-menu', fileMenu, note, 'calendar-context-menu', null);
				fileMenu.showAtPosition({
					x: event.pageX,
					y: event.pageY
				});
			})();

			if ($settingsStore.openPopoverOnRibbonHover && calendarPopoverStore) {
				(function removeCpCloseMechanism() {
					window.removeEventListener('mouseover', calendarPopoverStore.handleOnWindowEvent);
				})();

				(function setupGiveCpCloseMechanismBack() {
					const handleCpMouseoverEv = () => {
						const calendarPopoverStore = get(popoversStore)[CALENDAR_POPOVER_ID];
						const stickerPopoverStore = get(popoversStore)[STICKER_POPOVER_ID];

						const isOnlyCPOpen =
							calendarPopoverStore?.opened &&
							!stickerPopoverStore?.opened &&
							!document.querySelector('.menu');

						if (isOnlyCPOpen) {
							// add window.mouseover ev listener back once CP is hovered
							window.addEventListener('mouseover', calendarPopoverStore.handleOnWindowEvent);

							calendarPopoverStore.floatingEl?.removeEventListener(
								'mouseover',
								handleCpMouseoverEv
							);
						}
					};

					// cleanup previous callback
					if (calendarPopoverStore.handleOnFloatingElEvent) {
						calendarPopoverStore.floatingEl?.removeEventListener(
							'mouseover',
							calendarPopoverStore.handleOnFloatingElEvent
						);
					}

					// store callback to ensure later cleanup points to right place in memory
					popoversStore.update((values) => ({
						...values,
						[CALENDAR_POPOVER_ID]: {
							...values[CALENDAR_POPOVER_ID],
							handleOnFloatingElEvent: handleCpMouseoverEv
						} as IPopoverState
					}));

					calendarPopoverStore.floatingEl?.addEventListener('mouseover', handleCpMouseoverEv);
				})();
			}
		}
	};

	setContext<ICalendarViewCtx>(VIEW, {
		app: window.app,
		eventHandlers: {
			onClick,
			onHover,
			onContextMenu
		}
	});

	onDestroy(() => {
		clearInterval(heartbeat);
	});
</script>

{#if popover}
	<div
		class={clsx(
			popover && 'bg-transparent z-10 w-max opacity-0 pointer-events-none absolute top-0 left-0'
		)}
		data-popover={popover}
		id={CALENDAR_POPOVER_ID}
	>
		<div id={`${CALENDAR_POPOVER_ID}-arrow`} class="rotate-45 absolute w-2.5 h-2.5 bg-slate-500" />
		<div class="ml-[5px] p-2">
			<div class="bg-slate-500 rounded-sm">
				<Calendar />
			</div>
		</div>
	</div>
{/if}
{#if !popover}
	<Calendar />
{/if}

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
