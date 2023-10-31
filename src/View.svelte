<script lang="ts">
	import { Notice, type App, Menu } from 'obsidian';
	import clsx from 'clsx';
	import { onDestroy, setContext } from 'svelte';
	import Calendar from './calendar-ui/components/Calendar.svelte';
	import { displayedDateStore, notesStores, rerenderStore, settingsStore } from './stores';
	import type { Moment } from 'moment';
	import {
		tryToCreateNote,
		type IGranularity,
		getNoteByGranularity,
		getDateUID
	} from './calendar-io';
	import { VIEW } from './calendar-ui/context';
	import { getNoteSettingsByGranularity } from './calendar-io/settings';
	import { createStickerDialog } from './calendar-ui/modals/sticker-picker';

	export let popup: boolean = false;

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
		const dateUID = getDateUID(date, granularity);

		if (!note) {
			// TODO: improve wording
			new Notice('Create a note first');

			return;
		}

		const fileMenu = new Menu();
		fileMenu.addItem((item) =>
			item
				.setTitle('Add Sticker')
				.setIcon('smile-plus')
				.onClick(() => {
					// open modal
					createStickerDialog({ noteStore: notesStores[granularity], noteDateUID: dateUID });
				})
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

<div
	class={clsx(popup && 'bg-red-500 w-max opacity-0 pointer-events-none absolute top-0 left-0 duration-300')}
	data-popup={popup}
	data-opened='false'
>
	<Calendar />
</div>

<style>
	@tailwind components;
	@tailwind utilities;
</style>
