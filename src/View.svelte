<script lang="ts">
	import clsx from 'clsx';
	import type { Moment } from 'moment';
	import { Notice, type App } from 'obsidian';
	import { onDestroy, setContext } from 'svelte';
	import { CALENDAR_POPOVER_ID, FILE_MENU_POPOVER_ID } from './constants';
	import {
		createOrOpenNote,
		getNoteFromStore,
		getPeriodicityFromGranularity,
		type IGranularity
	} from './io';
	import { getNoteSettingsByPeriodicity } from './io/settings';
	import { displayedDateStore } from './stores';
	import Calendar from './ui/components/Calendar.svelte';
	import { VIEW } from './ui/context';
	import { Popover } from './ui/popovers';
	import { settingsStore } from '@/settings';

	export let popover: boolean = false;

	export function rerenderCalendar() {
		// TODO: reimplement
		// rerenderStore.update((val) => ({
		// 	...val,
		// 	rerender: true
		// }));
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
		createNewSplitLeaf,
		granularity
	}: {
		date: Moment;
		createNewSplitLeaf: boolean;
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
		createNewSplitLeaf,
		granularity
	}: Parameters<TOnClick>[0]): Promise<void> => {
		const leaf = window.app.workspace.getLeaf(createNewSplitLeaf);

		createOrOpenNote({ leaf, date, granularity });
	};

	const onHover = ({
		date,
		targetEl,
		isMetaPressed,
		granularity
	}: Parameters<TOnHover>[0]): void => {
		const { format } = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity));
		const note = getNoteFromStore({ date, granularity });

		if (isMetaPressed || $settingsStore.autoHoverPreview) {
			window.app.workspace.trigger('link-hover', targetEl, date.format(format), note?.path);
		}
	};

	const onContextMenu = ({ date, event, granularity }: Parameters<TOnContextMenu>[0]): void => {
		const note = getNoteFromStore({ date, granularity });

		if (note) {
			Popover.create({
				id: FILE_MENU_POPOVER_ID,
				note,
				event,
				date,
				granularity
			}).open();
		} else {
			// TODO: improve wording
			new Notice('Create a note first');
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

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	body {
		background-color: red;
		font-size: xx-large;
	}
</style>
