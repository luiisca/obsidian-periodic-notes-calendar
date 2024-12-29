<script lang="ts">
    import { CALENDAR_POPOVER_ID } from "@/constants";
    import locales from "@/locales";
    import { defaultWeekdays, sysLocaleKey } from "@/localization";
    import { ISettings, TimelineViewMode } from "@/settings/constants";
    import { settingsStore } from "@/settings/store";
    import { Dropdown, SettingItem, Toggle } from "@/settings/ui";
    import {
        previewLeafStore,
        switchLocale,
        updateWeekStartSetting,
    } from "@/stores";
    import { View, ViewManager } from "@/ui";
    import TimelineManager from "@/ui/components/timeline/manager";
    import { Popover } from "@/ui/popovers";
    import { handleLocaleCommands, isMobile, isTablet } from "@/utils";
    import { derived as derivedStore } from "svelte/store";
    import { selectedTabStore } from "../../stores";

    // Essential
    const handleViewLeafPositionChange = async (
        position: ISettings["viewLeafPosition"],
    ) => {
        settingsStore.update((s) => {
            s.viewLeafPosition = position as ISettings["viewLeafPosition"];
            if (position !== "root" && isMobile()) {
                s.preview.defaultExpansionMode = "maximized";
            }
            return s;
        });

        ViewManager.cleanupPreview();
        ViewManager.restartView({ active: false });
    };
    const handleFloatingModeToggle = (floatingMode: boolean) => {
        Popover.cleanup();

        if (floatingMode) {
            Popover.create({
                id: CALENDAR_POPOVER_ID,
                view: {
                    Component: View,
                    props: {
                        popover: true,
                    },
                },
            });
        }

        settingsStore.update((settings) => ({
            ...settings,
            floatingMode,
        }));
    };
    const handleMinimalModeToggle = (minimalMode: boolean) => {
        settingsStore.update((settings) => ({
            ...settings,
            minimalMode,
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
                },
            },
        });

        settingsStore.update((settings) => ({
            ...settings,
            floatingViewAlwaysMinimal: alwaysMinimal,
        }));
    };

    const handleToggleSyncCalendar = (syncCalendar: boolean) => {
        settingsStore.update((s) => {
            s.syncCalendar = syncCalendar;
            return s;
        });
    };

    // Preview
    const handleTogglePreview = (enabled: boolean) => {
        settingsStore.update((s) => {
            s.preview.enabled = enabled;
            return s;
        });
        if (!enabled) {
            ViewManager.cleanupPreview();
            ViewManager.cleaunupPreviewEvHandlers();
            previewLeafStore.update((s) => ({
                ...s,
                isOpenBttnVisible: false,
            }));
        } else {
            ViewManager.setupPreviewEvHandlers();
            previewLeafStore.update((s) => ({
                ...s,
                isOpenBttnVisible: true,
            }));
        }
    };
    const handleToggleOpenNotesInPreview = (openNotesInPreview: boolean) => {
        settingsStore.update((s) => {
            s.preview.openNotesInPreview = openNotesInPreview;
            return s;
        });
    };
    const handlePreviewTabHeaderToggle = (tabHeaderVisible: boolean) => {
        settingsStore.update((s) => {
            s.preview.tabHeaderVisible = tabHeaderVisible;
            return s;
        });
        if ($previewLeafStore?.visible) {
            ViewManager.restartPreview();
        }
    };
    const handleSelectDefaultSplitMode = (
        splitMode: ISettings["preview"]["defaultSplitMode"],
        panel: ISettings["viewLeafPosition"],
    ) => {
        settingsStore.update((s) => {
            if (panel === "root") {
                s.preview.centerDefaultSplitMode = splitMode;
            } else {
                s.preview.defaultSplitMode = splitMode;
            }
            return s;
        });
        if ($previewLeafStore?.visible) {
            ViewManager.restartPreview();
        }
    };
    const handleSelectDefaultExpansionMode = (
        expansionMode: ISettings["preview"]["defaultExpansionMode"],
    ) => {
        settingsStore.update((s) => {
            s.preview.defaultExpansionMode = expansionMode;
            return s;
        });
        ViewManager.cleanupPreview();
    };
    const handleToggleZenmode = (zenMode: boolean) => {
        settingsStore.update((s) => {
            s.preview.zenMode = zenMode;
            return s;
        });
    };

    // Interactive Behavior
    const handleOpenPopoverOnRibbonHover = (
        openPopoverOnRibbonHover: boolean,
    ) => {
        Popover.cleanup();

        settingsStore.update((settings) => ({
            ...settings,
            openPopoverOnRibbonHover,
        }));

        if (openPopoverOnRibbonHover) {
            Popover.create({
                id: CALENDAR_POPOVER_ID,
                view: {
                    Component: View,
                    props: {
                        popover: true,
                    },
                },
            });
        }
    };

    const handleShouldConfirmBeforeCreate = (
        shouldConfirmBeforeCreate: boolean,
    ) => {
        settingsStore.update((settings) => ({
            ...settings,
            shouldConfirmBeforeCreate,
        }));
    };

    const handleConfirmAutoHoverPreview = (autoHoverPreview: boolean) => {
        settingsStore.update((settings) => ({
            ...settings,
            autoHoverPreview,
        }));
    };

    const handleSequentialDismissalOnClickOut = (
        closePopoversOneByOneOnClickOut: boolean,
    ) => {
        settingsStore.update((settings) => ({
            ...settings,
            popoversClosing: {
                ...settings.popoversClosing,
                closePopoversOneByOneOnClickOut,
            },
        }));
    };
    const handleSequentialDismissalOnEsc = (
        closePopoversOneByOneOnEscKeydown: boolean,
    ) => {
        settingsStore.update((settings) => ({
            ...settings,
            popoversClosing: {
                ...settings.popoversClosing,
                closePopoversOneByOneOnEscKeydown,
            },
        }));
    };

    // Timeline
    const handleToggleTimeline = (enabled: boolean) => {
        settingsStore.update((s) => {
            s.timeline.enabled = enabled;
            return s;
        });
        if (enabled) {
            TimelineManager.restartAll();
        } else {
            TimelineManager.unmountAll();
        }
    };

    const handleToggleGranularityBased = (granularityBased: boolean) => {
        settingsStore.update((s) => {
            s.timeline.granularityBased = granularityBased;
            return s;
        });
        TimelineManager.restartAll();
    };
    const handleSetViewMode = (viewMode: TimelineViewMode) => {
        settingsStore.update((s) => {
            s.timeline.viewMode = viewMode;
            return s;
        });
        TimelineManager.restartAll();
    };
    const handleToggleDisplayOnRestNotes = (displayOnRestNotes: boolean) => {
        settingsStore.update((s) => {
            s.timeline.displayOnRestNotes = displayOnRestNotes;
            return s;
        });
        TimelineManager.restartAll();
    };
    const handleToggleDisplayStickers = (displayStickers: boolean) => {
        settingsStore.update((s) => {
            s.timeline.displayStickers = displayStickers;
            return s;
        });
        TimelineManager.restartAll();
    };
    const handleSetRestViewMode = (restViewMode: TimelineViewMode) => {
        settingsStore.update((s) => {
            s.timeline.restViewMode = restViewMode;
            return s;
        });
        TimelineManager.restartAll();
    };

    // Localization
    const handleSetLanguage = (localeKey: string) => {
        switchLocale(localeKey);
    };
    const getLanguageOptions = () => {
        let options = [
            {
                label: `Same as system - ${locales.get(sysLocaleKey) || sysLocaleKey}`,
                value: sysLocaleKey,
            },
        ];
        window.moment.locales().forEach((momentLocale) => {
            // use a name like "English" when available in static locales file otherwise use localeKey
            options.push({
                label: locales.get(momentLocale) || momentLocale,
                value: momentLocale,
            });
        });

        return options;
    };

    let firstWeekday = $derived(
        defaultWeekdays[$settingsStore.localeSettings.weekStartId],
    );
    const handleFirstWeekdayChange = (weekday: string) => {
        const newWeekStartId = defaultWeekdays.indexOf(weekday);

        updateWeekStartSetting(newWeekStartId);
    };
    const weekdayOptionsStore = derivedStore(settingsStore, () => {
        let options = [
            {
                label: `Locale default - ${
                    window.moment.localeData().weekdays()[
                        window.moment.localeData().firstDayOfWeek()
                    ]
                }`,
                value: defaultWeekdays[
                    window.moment.localeData().firstDayOfWeek()
                ],
            },
        ];
        window.moment
            .localeData()
            .weekdays()
            .forEach((localizedDay, i) => {
                options.push({
                    label: localizedDay,
                    value: defaultWeekdays[i],
                });
            });

        return options;
    });

    const handleAllowLocalesSwitchFromCommandPalette = (
        allowLocalesSwitchFromCommandPalette: boolean,
    ) => {
        settingsStore.update((settings) => ({
            ...settings,
            allowLocalesSwitchFromCommandPalette,
        }));

        handleLocaleCommands();
    };
</script>

<SettingItem isHeading={true} name="Essential" />
<SettingItem
    name="Calendar Panel Location"
    description="Choose where the calendar appears in your workspace (left or right sidebar)"
    type="dropdown"
>
    {#snippet control()}
        <Dropdown
            options={[
                { label: "Left", value: "left" },
                { label: "Main", value: "root" },
                { label: "Right", value: "right" },
            ]}
            onChange={handleViewLeafPositionChange}
            value={$settingsStore.viewLeafPosition}
        />
    {/snippet}
</SettingItem>

{#if !isMobile()}
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
            name="Quick Access"
            description="Enable opening the calendar on ribbon hover instead of click."
        >
            {#snippet control()}
                <Toggle
                    onChange={handleOpenPopoverOnRibbonHover}
                    isEnabled={$settingsStore.openPopoverOnRibbonHover}
                />
            {/snippet}
        </SettingItem>
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
{/if}

<SettingItem
    name="Auto-sync Calendar Date"
    description="Automatically update calendar to display date of current periodic note"
>
    {#snippet control()}
        <Toggle
            onChange={handleToggleSyncCalendar}
            isEnabled={$settingsStore.syncCalendar}
        />
    {/snippet}
</SettingItem>

<SettingItem isHeading={true} name="Preview" className="pb-0" />
<div class="flex justify-between">
    <p>
        Configure default settings for the preview panel. For period-specific
        options, visit
        <a href={null} onclick={() => selectedTabStore.set("periods")}
            >Periods</a
        >.
    </p>
    <SettingItem type="toggle" className="[border-top:none]">
        {#snippet control()}
            <Toggle
                isEnabled={$settingsStore.preview.enabled}
                onChange={handleTogglePreview}
            />
        {/snippet}
    </SettingItem>
</div>

{#if $settingsStore.preview.enabled}
    <SettingItem
        name="Preview Calendar Notes"
        description="Display opened periodic notes in preview mode by default."
    >
        {#snippet control()}
            <Toggle
                onChange={handleToggleOpenNotesInPreview}
                isEnabled={$settingsStore.preview.openNotesInPreview}
            />
        {/snippet}
    </SettingItem>

    {#if !isMobile()}
        <SettingItem
            name="Display Tab Header"
            description="By default, the tab header (showing the note's icon) is hidden. Toggle this option to make it visible."
        >
            {#snippet control()}
                <Toggle
                    onChange={handlePreviewTabHeaderToggle}
                    isEnabled={$settingsStore.preview.tabHeaderVisible}
                />
            {/snippet}
        </SettingItem>

        <SettingItem
            name="Split Mode for Side Panels"
            description="Select how the preview panel will be split in the left and right panels."
        >
            {#snippet control()}
                <Dropdown
                    options={[
                        { label: "Horizontal", value: "horizontal" },
                        { label: "Vertical", value: "vertical" },
                    ]}
                    onChange={(
                        splitMode: ISettings["preview"]["defaultSplitMode"],
                    ) =>
                        splitMode
                            ? handleSelectDefaultSplitMode(splitMode, "left")
                            : null}
                    value={$settingsStore.preview.defaultSplitMode}
                />
            {/snippet}
        </SettingItem>
    {/if}

    {#if ($settingsStore.viewLeafPosition === "root" && isTablet()) || !isMobile()}
        <SettingItem
            name="Split Mode for Main Panel"
            description="Select how the preview panel will be split in the main panel."
        >
            {#snippet control()}
                <Dropdown
                    options={[
                        { label: "Horizontal", value: "horizontal" },
                        { label: "Vertical", value: "vertical" },
                    ]}
                    onChange={(
                        splitMode: ISettings["preview"]["defaultSplitMode"],
                    ) =>
                        splitMode
                            ? handleSelectDefaultSplitMode(splitMode, "root")
                            : null}
                    value={$settingsStore.preview.centerDefaultSplitMode}
                />
            {/snippet}
        </SettingItem>

        <SettingItem
            name="Expansion Mode"
            description="Choose whether the preview panel fills the entire panel (maximized) or appears as a split view."
        >
            {#snippet control()}
                <Dropdown
                    options={[
                        { label: "Maximized", value: "maximized" },
                        { label: "Split", value: "split" },
                    ]}
                    onChange={handleSelectDefaultExpansionMode}
                    value={$settingsStore.preview.defaultExpansionMode}
                />
            {/snippet}
        </SettingItem>
    {/if}

    <SettingItem
        name="Zen mode"
        description="Hide the outline and periodic notes navigation buttons for a focused view."
    >
        {#snippet control()}
            <Toggle
                onChange={handleToggleZenmode}
                isEnabled={$settingsStore.preview.zenMode}
            />
        {/snippet}
    </SettingItem>
{/if}

{#if $settingsStore.floatingMode && !isMobile()}
    <SettingItem isHeading={true} name="Popover Windows" />
    <SettingItem
        name="Sequential Dismissal (Click)"
        description="Close floating windows one at a time when clicking outside"
    >
        {#snippet control()}
            <Toggle
                onChange={handleSequentialDismissalOnClickOut}
                isEnabled={$settingsStore.popoversClosing
                    .closePopoversOneByOneOnClickOut}
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
                isEnabled={$settingsStore.popoversClosing
                    .closePopoversOneByOneOnEscKeydown}
            />
        {/snippet}
    </SettingItem>
{/if}

<SettingItem isHeading={true} name="Timeline" className="pb-0" />
<div class="flex justify-between">
    <p>
        Quickly jump between time periods from the top of your periodic notes.
    </p>
    <SettingItem type="toggle" className="[border-top:none]">
        {#snippet control()}
            <Toggle
                onChange={handleToggleTimeline}
                isEnabled={$settingsStore.timeline.enabled}
            />
        {/snippet}
    </SettingItem>
</div>

{#if $settingsStore.timeline.enabled}
    <SettingItem
        name="Unique Timelines for Periodic Notes"
        description="Toggle to show a specific timeline for each type of periodic note. When off, all periodic notes share the same week-based timeline."
    >
        {#snippet control()}
            <Toggle
                onChange={handleToggleGranularityBased}
                isEnabled={$settingsStore.timeline.granularityBased}
            />
        {/snippet}
    </SettingItem>
    <SettingItem
        name="Periodic Notes Timeline View Mode"
        description="Set the default display mode for the timeline, either expanded or collapsed."
    >
        {#snippet control()}
            <Dropdown
                options={[
                    { label: "Expanded", value: "expanded" },
                    { label: "Collapsed", value: "collapsed" },
                ]}
                onChange={handleSetViewMode}
                value={$settingsStore.timeline.viewMode}
            />
        {/snippet}
    </SettingItem>

    <SettingItem
        name="Show Timeline Everywhere"
        description="Enable the timeline for all notes, not just periodic ones."
    >
        {#snippet control()}
            <Toggle
                onChange={handleToggleDisplayOnRestNotes}
                isEnabled={$settingsStore.timeline.displayOnRestNotes}
            />
        {/snippet}
    </SettingItem>

    <SettingItem
        name="Show Timeline Stickers"
        description="Show emoji stickers in the timeline view"
    >
        {#snippet control()}
            <Toggle
                onChange={handleToggleDisplayStickers}
                isEnabled={$settingsStore.timeline.displayStickers}
            />
        {/snippet}
    </SettingItem>

    {#if $settingsStore.timeline.displayOnRestNotes}
        <SettingItem
            name="Non-Periodic Notes Timeline View Mode"
            description="Set the default display mode for the timeline on non-periodic notes."
        >
            {#snippet control()}
                <Dropdown
                    options={[
                        { label: "Expanded", value: "expanded" },
                        { label: "Collapsed", value: "collapsed" },
                    ]}
                    onChange={handleSetRestViewMode}
                    value={$settingsStore.timeline.restViewMode}
                />
            {/snippet}
        </SettingItem>
    {/if}
{/if}

<SettingItem isHeading={true} name="Interaction Behavior" />

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

{#if !isMobile()}
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
{/if}

<SettingItem isHeading={true} name="Localization" />
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

<SettingItem
    name="Week Starts On"
    description="Choose which day your week begins with"
>
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
    description="Enable language switching through the command palette (command: Switch locale)"
>
    {#snippet control()}
        <Toggle
            onChange={handleAllowLocalesSwitchFromCommandPalette}
            isEnabled={$settingsStore.allowLocalesSwitchFromCommandPalette}
        />
    {/snippet}
</SettingItem>
