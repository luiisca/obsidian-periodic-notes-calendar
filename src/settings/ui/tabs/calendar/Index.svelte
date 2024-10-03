<script lang="ts">
	import { CALENDAR_POPOVER_ID, VIEW_TYPE } from '@/constants';
	import locales from '@/locales';
	import { defaultWeekdays, sysLocaleKey } from '@/localization';
	import { settingsStore } from '@/settings/store';
	import { Dropdown, SettingItem, Toggle } from '@/settings/ui';
	import { updateLocale, updateWeekdays, updateWeekStart } from '@/stores';
	import { Popover } from '@/ui/popovers';
	import { capitalize } from '@/utils';
	import View from '@/View.svelte';
	import { derived } from 'svelte/store';

	// Display
	const handleViewLeafPositionChange = async (position: 'left' | 'right') => {
		window.app.workspace.detachLeavesOfType(VIEW_TYPE);

		await window.app.workspace[`get${capitalize(position) as 'Left' | 'Right'}Leaf`](
			false
		)?.setViewState({
			type: VIEW_TYPE,
			active: false
		});

		settingsStore.update((settings) => ({
			...settings,
			viewLeafPosition: position as 'left' | 'right'
		}));
	};
	const handleViewModeChange = (viewMode: 'dedicated-panel' | 'floating-window') => {
		Popover.cleanup();

		if (viewMode === 'floating-window') {
			Popover.create({
				id: CALENDAR_POPOVER_ID,
				view: {
					Component: View
				}
			});
		}

		settingsStore.update((settings) => ({
			...settings,
			viewMode
		}));
	};

	const handleShowWeekNums = (show: boolean) => {
		settingsStore.update((settings) => ({
			...settings,
			localeSettings: {
				...settings.localeSettings,
				showWeekNums: show
			}
		}));
	};

	const handleShowQuarterNums = (show: boolean) => {
		settingsStore.update((settings) => ({
			...settings,
			localeSettings: {
				...settings.localeSettings,
				showQuarterNums: show
			}
		}));
	};

	// Interactive Behavior
	const handleOpenPopoverOnRibbonHover = (openPopoverOnRibbonHover: boolean) => {
		Popover.cleanup();

		settingsStore.update((settings) => ({
			...settings,
			openPopoverOnRibbonHover
		}));

		if (openPopoverOnRibbonHover) {
			Popover.create({
				id: CALENDAR_POPOVER_ID,
				view: {
					Component: View
				}
			});
		}
	};

	const handleShouldConfirmBeforeCreate = (shouldConfirmBeforeCreate: boolean) => {
		settingsStore.update((settings) => ({
			...settings,
			shouldConfirmBeforeCreate
		}));
	};

	const handleConfirmAutoHoverPreview = (autoHoverPreview: boolean) => {
		settingsStore.update((settings) => ({
			...settings,
			autoHoverPreview
		}));
	};

	const handleSequentialDismissalOnClickOut = (closePopoversOneByOneOnClickOut: boolean) => {
		settingsStore.update((settings) => ({
			...settings,
			popoversClosing: {
				...settings.popoversClosing,
				closePopoversOneByOneOnClickOut
			}
		}));
	};
	const handleSequentialDismissalOnEsc = (closePopoversOneByOneOnEscKeydown: boolean) => {
		settingsStore.update((settings) => ({
			...settings,
			popoversClosing: {
				...settings.popoversClosing,
				closePopoversOneByOneOnEscKeydown
			}
		}));
	};

	// Localization
	const handleSetLanguage = (localeKey: string) => {
		updateLocale(localeKey);
		updateWeekStart();
		updateWeekdays();
	};
	const getLanguageOptions = () => {
		let options = [
			{
				label: `Same as system - ${locales.get(sysLocaleKey) || sysLocaleKey}`,
				value: sysLocaleKey
			}
		];
		window.moment.locales().forEach((momentLocale) => {
			// use a name like "English" when available in static locales file otherwise use localeKey
			options.push({
				label: locales.get(momentLocale) || momentLocale,
				value: momentLocale
			});
		});

		return options;
	};

	$: firstWeekday = defaultWeekdays[$settingsStore.localeSettings.weekStartId];
	const handleFirstWeekdayChange = (weekday: string) => {
		const newWeekStartId = defaultWeekdays.indexOf(weekday);

		updateWeekStart(newWeekStartId);
		updateWeekdays();
	};
	const weekdayOptionsStore = derived(settingsStore, () => {
		let options = [
			{
				label: `Locale default - ${
					window.moment.localeData().weekdays()[window.moment.localeData().firstDayOfWeek()]
				}`,
				value: defaultWeekdays[window.moment.localeData().firstDayOfWeek()]
			}
		];
		window.moment
			.localeData()
			.weekdays()
			.forEach((localizedDay, i) => {
				options.push({ label: localizedDay, value: defaultWeekdays[i] });
			});

		return options;
	});
	$: weekdayOptions = $weekdayOptionsStore;

	const handleAllowLocalesSwitchFromCommandPalette = (
		allowLocalesSwitchFromCommandPalette: boolean
	) => {
		settingsStore.update((settings) => ({
			...settings,
			allowLocalesSwitchFromCommandPalette
		}));
	};
</script>

<h3>Display</h3>
<SettingItem
	name="Calendar Panel Location"
	description="Choose where the calendar appears in your workspace (left or right sidebar)"
	type="dropdown"
>
	<Dropdown
		slot="control"
		options={[
			{ label: 'Left', value: 'left' },
			{ label: 'Right', value: 'right' }
		]}
		onChange={handleViewLeafPositionChange}
		value={$settingsStore.viewLeafPosition}
	/>
</SettingItem>

<SettingItem
	name="View Mode"
	description="Show calendar in a dedicated workspace panel (recommended) or as a floating window"
>
	<Dropdown
		slot="control"
		options={[
			{ label: 'Dedicated Panel', value: 'dedicated-panel' },
			{ label: 'Floating Window', value: 'floating-window' }
		]}
		onChange={handleViewModeChange}
		value={$settingsStore.viewMode}
	/>
</SettingItem>

<SettingItem
	name="Week Numbers"
	description="Display week numbers alongside the calendar for easier temporal reference"
>
	<Toggle
		slot="control"
		onChange={handleShowWeekNums}
		isEnabled={$settingsStore.localeSettings.showWeekNums}
	/>
</SettingItem>

<SettingItem
	name="Fiscal Quarters"
	description="Show quarter divisions for business and academic planning"
>
	<Toggle
		slot="control"
		onChange={handleShowQuarterNums}
		isEnabled={$settingsStore.localeSettings.showQuarterNums}
	/>
</SettingItem>

{#if $settingsStore.viewMode === 'floating-window'}
	<h3>Popover Windows</h3>
	<SettingItem
		name="Sequential Dismissal (Click)"
		description="Close floating windows one at a time when clicking outside"
	>
		<Toggle
			slot="control"
			onChange={handleSequentialDismissalOnClickOut}
			isEnabled={$settingsStore.popoversClosing.closePopoversOneByOneOnClickOut}
		/>
	</SettingItem>

	<SettingItem
		name="Sequential Dismissal (Esc)"
		description="Close floating windows one at a time when pressing Escape"
	>
		<Toggle
			slot="control"
			onChange={handleSequentialDismissalOnEsc}
			isEnabled={$settingsStore.popoversClosing.closePopoversOneByOneOnEscKeydown}
		/>
	</SettingItem>
{/if}

<h3>Interaction Behavior</h3>
<SettingItem
	name="Quick Access"
	description="Show calendar when hovering over the ribbon icon for faster navigation"
>
	<Toggle
		slot="control"
		onChange={handleOpenPopoverOnRibbonHover}
		isEnabled={$settingsStore.openPopoverOnRibbonHover}
	/>
</SettingItem>

<SettingItem
	name="Creation Confirmation"
	description="Prompt before creating new periodic notes to prevent accidental entries"
>
	<Toggle
		slot="control"
		onChange={handleShouldConfirmBeforeCreate}
		isEnabled={$settingsStore.shouldConfirmBeforeCreate}
	/>
</SettingItem>

<SettingItem
	name="Hover Preview"
	description="Instantly preview notes by hovering over dates (no modifier key needed)"
>
	<Toggle
		slot="control"
		onChange={handleConfirmAutoHoverPreview}
		isEnabled={$settingsStore.autoHoverPreview}
	/>
</SettingItem>

<h3>Localization</h3>
<SettingItem
	name="Calendar Language"
	description="Set a specific language for the calendar interface"
>
	<Dropdown
		slot="control"
		options={getLanguageOptions()}
		onChange={handleSetLanguage}
		value={$settingsStore.localeSettings.localeOverride}
	/>
</SettingItem>

<SettingItem name="Week Starts On" description="Choose which day your week begins with">
	<Dropdown
		slot="control"
		options={weekdayOptions}
		onChange={handleFirstWeekdayChange}
		value={firstWeekday}
	/>
</SettingItem>

<SettingItem
	name="Quick Language Switching"
	description="Enable language switching through the command palette (requires restart)"
>
	<Toggle
		slot="control"
		onChange={handleAllowLocalesSwitchFromCommandPalette}
		isEnabled={$settingsStore.allowLocalesSwitchFromCommandPalette}
	/>
</SettingItem>
