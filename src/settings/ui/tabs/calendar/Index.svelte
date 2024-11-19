<script lang="ts">
	import { CALENDAR_POPOVER_ID } from '@/constants';
	import locales from '@/locales';
	import { defaultWeekdays, sysLocaleKey } from '@/localization';
    import { ViewManager } from '@/main';
	import { ISettings } from '@/settings/constants';
	import { settingsStore } from '@/settings/store';
	import { Dropdown, SettingItem, Toggle } from '@/settings/ui';
	import { updateLocale, updateWeekdays, updateWeekStart } from '@/stores';
	import { Popover } from '@/ui/popovers';
	import View from '@/View.svelte';
	import { derived as derivedStore } from 'svelte/store';

	// Display
	const handleViewLeafPositionChange = async (position: ISettings["viewLeafPosition"]) => {
        ViewManager.initView({ active: false });

		settingsStore.update((settings) => ({
			...settings,
			viewLeafPosition: position as ISettings["viewLeafPosition"]
		}));
	};
	const handleFloatingModeToggle = (floatingMode: boolean) => {
		Popover.cleanup();

		if (floatingMode) {
			Popover.create({
				id: CALENDAR_POPOVER_ID,
				view: {
					Component: View,
                    props: {
                        popover: true
                    }
				}
			});
		}

		settingsStore.update((settings) => ({
			...settings,
			floatingMode
		}));
	};
	const handleMinimalModeToggle = (minimalMode: boolean) => {
		settingsStore.update((settings) => ({
			...settings,
			minimalMode
		}));
	};

	const handleFloatingAlwaysMinimalToggle = (alwaysMinimal: boolean) => {
		Popover.cleanup();
        Popover.create({
            id: CALENDAR_POPOVER_ID,
            view: {
                Component: View,
                props: {
                    popover: true,
                }
            }
        });

		settingsStore.update((settings) => ({
			...settings,
			floatingViewAlwaysMinimal: alwaysMinimal
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
					Component: View,
                    props: {
                        popover: true
                    }
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

	let firstWeekday = $derived(defaultWeekdays[$settingsStore.localeSettings.weekStartId]);
	const handleFirstWeekdayChange = (weekday: string) => {
		const newWeekStartId = defaultWeekdays.indexOf(weekday);

		updateWeekStart(newWeekStartId);
		updateWeekdays();
	};
	const weekdayOptionsStore = derivedStore(settingsStore, () => {
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

        return options
	});

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
	{#snippet control()}
		<Dropdown
			
			options={[
				{ label: 'Left', value: 'left' },
				{ label: 'Center', value: 'center' },
				{ label: 'Right', value: 'right' }
			]}
			onChange={handleViewLeafPositionChange}
			value={$settingsStore.viewLeafPosition}
		/>
	{/snippet}
</SettingItem>

<SettingItem
    name="Minimal Mode"
    description="Use compact layout with simplified visuals"
>
    {#snippet control()}
        <Toggle
            onChange={handleMinimalModeToggle}
            isEnabled={$settingsStore.minimalMode}
        />
    {/snippet}
</SettingItem>

<SettingItem
	name="Floating Mode"
	description="Show calendar on ribbon click or hover (always available in panel or through command palette)"
>
	{#snippet control()}
		<Toggle
			onChange={handleFloatingModeToggle}
			isEnabled={$settingsStore.floatingMode}
		/>
	{/snippet}
</SettingItem>

{#if $settingsStore.floatingMode}
    <SettingItem
        name="Always Minimal"
        description="Keep floating view compact for quick reference"
    >
        {#snippet control()}
            <Toggle
                onChange={handleFloatingAlwaysMinimalToggle}
                isEnabled={$settingsStore.floatingViewAlwaysMinimal}
            />
        {/snippet}
    </SettingItem>
{/if}

<SettingItem
	name="Week Numbers"
	description="Display week numbers alongside the calendar for easier temporal reference"
>
	{#snippet control()}
		<Toggle
			
			onChange={handleShowWeekNums}
			isEnabled={$settingsStore.localeSettings.showWeekNums}
		/>
	{/snippet}
</SettingItem>

<SettingItem
	name="Fiscal Quarters"
	description="Show quarter divisions for business and academic planning"
>
	{#snippet control()}
		<Toggle
			
			onChange={handleShowQuarterNums}
			isEnabled={$settingsStore.localeSettings.showQuarterNums}
		/>
	{/snippet}
</SettingItem>

{#if $settingsStore.floatingMode}
	<h3>Popover Windows</h3>
	<SettingItem
		name="Sequential Dismissal (Click)"
		description="Close floating windows one at a time when clicking outside"
	>
		{#snippet control()}
				<Toggle
				
				onChange={handleSequentialDismissalOnClickOut}
				isEnabled={$settingsStore.popoversClosing.closePopoversOneByOneOnClickOut}
			/>
			{/snippet}
	</SettingItem>

	<SettingItem
		name="Sequential Dismissal (Esc)"
		description="Close floating windows one at a time when pressing Escape"
	>
		{#snippet control()}
				<Toggle
				
				onChange={handleSequentialDismissalOnEsc}
				isEnabled={$settingsStore.popoversClosing.closePopoversOneByOneOnEscKeydown}
			/>
			{/snippet}
	</SettingItem>
{/if}

<h3>Interaction Behavior</h3>
<SettingItem
	name="Quick Access"
	description="Show calendar when hovering over the ribbon icon for faster navigation"
>
	{#snippet control()}
		<Toggle
			
			onChange={handleOpenPopoverOnRibbonHover}
			isEnabled={$settingsStore.openPopoverOnRibbonHover}
		/>
	{/snippet}
</SettingItem>

<SettingItem
	name="Creation Confirmation"
	description="Prompt before creating new periodic notes to prevent accidental entries"
>
	{#snippet control()}
		<Toggle
			
			onChange={handleShouldConfirmBeforeCreate}
			isEnabled={$settingsStore.shouldConfirmBeforeCreate}
		/>
	{/snippet}
</SettingItem>

<SettingItem
	name="Hover Preview"
	description="Instantly preview notes by hovering over dates (no modifier key needed)"
>
	{#snippet control()}
		<Toggle
			
			onChange={handleConfirmAutoHoverPreview}
			isEnabled={$settingsStore.autoHoverPreview}
		/>
	{/snippet}
</SettingItem>

<h3>Localization</h3>
<SettingItem
	name="Calendar Language"
	description="Set a specific language for the calendar interface"
>
	{#snippet control()}
		<Dropdown
			
			options={getLanguageOptions()}
			onChange={handleSetLanguage}
			value={$settingsStore.localeSettings.localeOverride}
		/>
	{/snippet}
</SettingItem>

<SettingItem name="Week Starts On" description="Choose which day your week begins with">
	{#snippet control()}
		<Dropdown
			options={$weekdayOptionsStore}
			onChange={handleFirstWeekdayChange}
			value={firstWeekday}
		/>
	{/snippet}
</SettingItem>

<SettingItem
	name="Quick Language Switching"
	description="Enable language switching through the command palette (requires restart)"
>
	{#snippet control()}
		<Toggle
			
			onChange={handleAllowLocalesSwitchFromCommandPalette}
			isEnabled={$settingsStore.allowLocalesSwitchFromCommandPalette}
		/>
	{/snippet}
</SettingItem>
